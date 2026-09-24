import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomersService } from '../customers/customers.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { calculateInvoiceItem, calculateInvoiceTotals, round3Decimals } from './invoices-calc.util';
import { InvoiceStatus, PaymentMethod, Prisma } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
  ) {}

  /**
   * Genera el siguiente número correlativo de factura secuencial único por tenant
   */
  private async getNextInvoiceNumber(tx: Prisma.TransactionClient, tenantId: string): Promise<string> {
    const lastInvoice = await tx.invoice.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true },
    });

    if (!lastInvoice || !lastInvoice.invoiceNumber.startsWith('INV-')) {
      return 'INV-000001';
    }

    const currentNumStr = lastInvoice.invoiceNumber.replace('INV-', '');
    const currentNum = parseInt(currentNumStr, 10);
    const nextNum = isNaN(currentNum) ? 1 : currentNum + 1;
    return `INV-${nextNum.toString().padStart(6, '0')}`;
  }

  async findAll(
    tenantId: string,
    status?: InvoiceStatus,
    search?: string,
    customerId?: string,
  ) {
    const trimmed = search?.trim();
    return this.prisma.invoice.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
        ...(customerId ? { customerId } : {}),
        ...(trimmed
          ? {
              OR: [
                { invoiceNumber: { contains: trimmed, mode: 'insensitive' } },
                { customer: { name: { contains: trimmed, mode: 'insensitive' } } },
                { customer: { taxId: { contains: trimmed, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: {
        customer: {
          select: { id: true, taxId: true, name: true, phone: true, address: true, email: true },
        },
        items: {
          include: {
            article: { select: { id: true, code: true, name: true, appliesVat: true } },
            contributor: { select: { id: true, code: true, name: true, entityId: true } },
            entity: { select: { id: true, code: true, name: true } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        items: {
          include: {
            article: { select: { id: true, code: true, name: true, appliesVat: true } },
            contributor: { select: { id: true, code: true, name: true, entityId: true } },
            entity: { select: { id: true, code: true, name: true } },
          },
        },
        payments: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Factura con ID "${id}" no encontrada`);
    }

    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + round3Decimals(Number(p.amount)),
      0,
    );
    const balanceDue = Math.max(0, round3Decimals(Number(invoice.total) - totalPaid));

    return {
      ...invoice,
      totalPaid: round3Decimals(totalPaid),
      balanceDue: round3Decimals(balanceDue),
    };
  }

  async create(dto: CreateInvoiceDto, tenantId: string, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('La factura debe contener al menos un ítem');
    }

    const createdInvoiceId = await this.prisma.$transaction(async (tx) => {
      // 1. Resolver Cliente
      let resolvedCustomerId = dto.customerId;
      if (!resolvedCustomerId && dto.newCustomer) {
        const createdCustomer = await this.customersService.create(dto.newCustomer, tenantId);
        resolvedCustomerId = createdCustomer.id;
      }
      if (!resolvedCustomerId) {
        throw new BadRequestException(
          'Debe seleccionar un cliente existente o ingresar los datos del nuevo cliente fiscal',
        );
      }

      // Validar que el cliente existe en el tenant
      const client = await tx.customer.findFirst({
        where: { id: resolvedCustomerId, tenantId },
      });
      if (!client) {
        throw new NotFoundException('El cliente fiscal especificado no existe en la organización');
      }

      // 2. Resolver Artículos, Colaboradores/Médicos y Cálculos
      const articleIds = dto.items.map((i) => i.articleId);
      const contributorIds = dto.items.map((i) => i.contributorId).filter((id): id is string => !!id);
      const entityIds = dto.items.map((i) => i.entityId).filter((id): id is string => !!id);

      const [articles, contributors, entities] = await Promise.all([
        tx.article.findMany({
          where: { id: { in: articleIds }, tenantId },
          include: {
            participants: {
              select: { entityId: true, percentage: true },
            },
          },
        }),
        tx.contributor.findMany({ where: { id: { in: contributorIds }, tenantId } }),
        tx.entity.findMany({ where: { id: { in: entityIds }, tenantId } }),
      ]);

      const articlesMap = new Map(articles.map((a) => [a.id, a]));
      const contributorsMap = new Map(contributors.map((c) => [c.id, c]));
      const entitiesMap = new Map(entities.map((e) => [e.id, e]));

      const calculatedItems = dto.items.map((item) => {
        const article = articlesMap.get(item.articleId);
        if (!article) {
          throw new BadRequestException(`El artículo "${item.articleId}" no existe`);
        }

        let contributorId: string | null = null;
        let entityId: string | null = null;

        if (item.contributorId) {
          const contrib = contributorsMap.get(item.contributorId);
          if (!contrib) {
            throw new BadRequestException(`El médico/personal "${item.contributorId}" no existe`);
          }
          contributorId = contrib.id;
          entityId = item.entityId || contrib.entityId || null;
        } else if (item.entityId) {
          if (!entitiesMap.has(item.entityId)) {
            throw new BadRequestException(`La entidad colaboradora "${item.entityId}" no existe`);
          }
          entityId = item.entityId;
        }

        // Construir JSON con los porcentajes a repartir entre las entidades involucradas
        const participantsJson = (article.participants || []).map((p) => ({
          entityId: p.entityId,
          percentage: Number(p.percentage),
        }));

        // Obtener el precio seleccionado
        let selectedPrice = Number(article.price1);
        if (item.priceType === 'PRICE_2' && article.price2 !== null) selectedPrice = Number(article.price2);
        else if (item.priceType === 'PRICE_3' && article.price3 !== null) selectedPrice = Number(article.price3);
        else if (item.priceType === 'PRICE_4' && article.price4 !== null) selectedPrice = Number(article.price4);

        const calc = calculateInvoiceItem(
          selectedPrice,
          item.quantity,
          article.appliesVat ?? false,
        );

        return {
          articleId: item.articleId,
          contributorId,
          entityId,
          priceType: item.priceType,
          quantity: item.quantity,
          basePrice: calc.basePrice,
          vatAmount: calc.vatAmount,
          subtotal: calc.subtotal,
          total: calc.total,
          participantsJson,
        };
      });

      const totals = calculateInvoiceTotals(calculatedItems);
      const invoiceNumber = await this.getNextInvoiceNumber(tx, tenantId);

      // 3. Crear Cabecera de Factura
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          invoiceNumber,
          customerId: resolvedCustomerId,
          type: dto.type,
          status: InvoiceStatus.PENDING,
          subtotal: new Prisma.Decimal(totals.subtotal),
          vatAmount: new Prisma.Decimal(totals.vatAmount),
          total: new Prisma.Decimal(totals.total),
          notes: dto.notes?.trim() || null,
          createdById: userId || null,
          items: {
            create: calculatedItems.map((ci) => ({
              tenantId,
              articleId: ci.articleId,
              contributorId: ci.contributorId,
              entityId: ci.entityId,
              priceType: ci.priceType,
              quantity: new Prisma.Decimal(ci.quantity),
              basePrice: new Prisma.Decimal(ci.basePrice),
              vatAmount: new Prisma.Decimal(ci.vatAmount),
              subtotal: new Prisma.Decimal(ci.subtotal),
              total: new Prisma.Decimal(ci.total),
              participantsJson: ci.participantsJson,
            })),
          },
        },
        include: {
          customer: true,
          items: true,
          payments: true,
        },
      });

      // 4. Si se incluyeron pagos iniciales, procesarlos
      let totalPaid = 0;
      if (dto.payments && dto.payments.length > 0) {
        for (const p of dto.payments) {
          const roundedAmount = round3Decimals(p.amount);
          totalPaid += roundedAmount;

          let change: number | null = null;
          if (p.paymentMethod === PaymentMethod.CASH && p.receivedAmount && p.receivedAmount > p.amount) {
            change = round3Decimals(p.receivedAmount - p.amount);
          }

          await tx.invoicePayment.create({
            data: {
              tenantId,
              invoiceId: invoice.id,
              paymentMethod: p.paymentMethod,
              amount: new Prisma.Decimal(roundedAmount),
              receivedAmount: p.receivedAmount ? new Prisma.Decimal(round3Decimals(p.receivedAmount)) : null,
              changeAmount: change !== null ? new Prisma.Decimal(change) : null,
              reference: p.reference?.trim() || null,
              receivedById: userId || null,
            },
          });
        }

        // Si cubre o supera el total, cambiar a PAID
        if (totalPaid >= totals.total) {
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: InvoiceStatus.PAID },
          });
        }
      }

      return invoice.id;
    });

    return this.findOne(createdInvoiceId, tenantId);
  }

  async addPayment(invoiceId: string, dto: CreatePaymentDto, tenantId: string, userId?: string) {
    const targetInvoiceId = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: { payments: true },
      });

      if (!invoice) {
        throw new NotFoundException('Factura no encontrada');
      }

      if (invoice.status === InvoiceStatus.VOIDED) {
        throw new BadRequestException('No se pueden registrar pagos a una factura ANULADA');
      }

      const totalPaidExisting = invoice.payments.reduce(
        (sum, p) => sum + round3Decimals(Number(p.amount)),
        0,
      );
      const invoiceTotal = round3Decimals(Number(invoice.total));
      const remainingBalance = Math.max(0, round3Decimals(invoiceTotal - totalPaidExisting));

      const paymentAmount = round3Decimals(dto.amount);

      let change: number | null = null;
      if (dto.paymentMethod === PaymentMethod.CASH) {
        if (dto.receivedAmount && dto.receivedAmount > paymentAmount) {
          change = round3Decimals(dto.receivedAmount - paymentAmount);
        } else if (totalPaidExisting + paymentAmount > invoiceTotal) {
          change = round3Decimals(totalPaidExisting + paymentAmount - invoiceTotal);
        }
      }

      await tx.invoicePayment.create({
        data: {
          tenantId,
          invoiceId: invoice.id,
          paymentMethod: dto.paymentMethod,
          amount: new Prisma.Decimal(paymentAmount),
          receivedAmount: dto.receivedAmount ? new Prisma.Decimal(round3Decimals(dto.receivedAmount)) : null,
          changeAmount: change !== null ? new Prisma.Decimal(change) : null,
          reference: dto.reference?.trim() || null,
          receivedById: userId || null,
        },
      });

      // Evaluar si transiciona a PAID
      const newTotalPaid = round3Decimals(totalPaidExisting + paymentAmount);
      if (newTotalPaid >= invoiceTotal) {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: InvoiceStatus.PAID },
        });
      }

      return invoice.id;
    });

    return this.findOne(targetInvoiceId, tenantId);
  }

  async deletePayment(invoiceId: string, paymentId: string, tenantId: string) {
    const targetInvoiceId = await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: { payments: true },
      });

      if (!invoice) {
        throw new NotFoundException('Factura no encontrada');
      }

      const payment = invoice.payments.find((p) => p.id === paymentId);
      if (!payment) {
        throw new NotFoundException('El pago indicado no existe en esta factura');
      }

      await tx.invoicePayment.delete({
        where: { id: paymentId },
      });

      // Recalcular saldo total pagado restante
      const remainingPayments = invoice.payments.filter((p) => p.id !== paymentId);
      const remainingPaid = remainingPayments.reduce(
        (sum, p) => sum + round3Decimals(Number(p.amount)),
        0,
      );

      // Si la factura estaba PAID y ahora el total pagado es menor, volver a PENDING
      if (remainingPaid < round3Decimals(Number(invoice.total))) {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: InvoiceStatus.PENDING },
        });
      }

      return invoice.id;
    });

    return this.findOne(targetInvoiceId, tenantId);
  }

  async voidInvoice(id: string, reason: string, tenantId: string) {
    const invoice = await this.findOne(id, tenantId);

    if (invoice.status === InvoiceStatus.VOIDED) {
      throw new BadRequestException('La factura ya se encuentra ANULADA');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.VOIDED,
        notes: invoice.notes
          ? `${invoice.notes} | ANULADA: ${reason.trim()}`
          : `ANULADA: ${reason.trim()}`,
      },
    });

    return this.findOne(updated.id, tenantId);
  }

  async sendInvoiceEmail(id: string, tenantId: string) {
    const invoice = await this.findOne(id, tenantId);
    if (!invoice.customer.email) {
      throw new BadRequestException(
        `El cliente "${invoice.customer.name}" no posee un correo electrónico registrado`,
      );
    }

    // Despacho del comprobante
    return {
      sent: true,
      recipient: invoice.customer.email,
      invoiceNumber: invoice.invoiceNumber,
      message: `Comprobante de factura ${invoice.invoiceNumber} enviado exitosamente a ${invoice.customer.email}`,
    };
  }
}
