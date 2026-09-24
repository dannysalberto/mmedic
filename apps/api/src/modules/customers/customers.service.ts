import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, search?: string) {
    const trimmed = search?.trim();
    return this.prisma.customer.findMany({
      where: {
        tenantId,
        ...(trimmed
          ? {
              OR: [
                { taxId: { contains: trimmed, mode: 'insensitive' } },
                { name: { contains: trimmed, mode: 'insensitive' } },
                { phone: { contains: trimmed, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findById(id: string, tenantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });
    if (!customer) {
      throw new NotFoundException(`Cliente con ID "${id}" no encontrado`);
    }
    return customer;
  }

  async findByTaxId(taxId: string, tenantId: string) {
    const trimmedTaxId = taxId.trim();
    const customer = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        taxId: { equals: trimmedTaxId, mode: 'insensitive' },
      },
    });
    return customer;
  }

  async create(dto: CreateCustomerDto, tenantId: string) {
    const trimmedTaxId = dto.taxId.trim();
    const trimmedName = dto.name.trim();

    // Validar si ya existe el cliente por RIF/Cédula en el tenant
    const existing = await this.findByTaxId(trimmedTaxId, tenantId);
    if (existing) {
      throw new ConflictException(
        `Ya existe un cliente registrado con el RIF/identificación "${trimmedTaxId}"`,
      );
    }

    return this.prisma.customer.create({
      data: {
        tenantId,
        taxId: trimmedTaxId,
        name: trimmedName,
        phone: dto.phone.trim(),
        address: dto.address.trim(),
        email: dto.email?.trim() || null,
      },
    });
  }

  async update(id: string, dto: UpdateCustomerDto, tenantId: string) {
    const customer = await this.findById(id, tenantId);

    if (dto.taxId && dto.taxId.trim() !== customer.taxId) {
      const trimmedTaxId = dto.taxId.trim();
      const existing = await this.findByTaxId(trimmedTaxId, tenantId);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Ya existe otro cliente registrado con el RIF/identificación "${trimmedTaxId}"`,
        );
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.taxId !== undefined ? { taxId: dto.taxId.trim() } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
        ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email ? dto.email.trim() : null } : {}),
      },
    });
  }

  async delete(id: string, tenantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Cliente con ID "${id}" no encontrado`);
    }

    // Regla de borrado seguro (Safe Deletion Rule)
    if (customer._count.invoices > 0) {
      throw new ConflictException(
        `No se puede eliminar el cliente "${customer.name}" porque posee ${customer._count.invoices} factura(s) registrada(s).`,
      );
    }

    await this.prisma.customer.delete({
      where: { id },
    });

    return { id };
  }
}
