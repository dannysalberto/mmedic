import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  private validateParticipants(
    participants?: { entityId: string; percentage: number }[],
  ) {
    if (!participants || participants.length === 0) return;

    const entityIds = new Set<string>();
    let totalPercentage = 0;

    for (const p of participants) {
      if (entityIds.has(p.entityId)) {
        throw new BadRequestException(
          'No se permite asociar la misma entidad más de una vez en el artículo',
        );
      }
      entityIds.add(p.entityId);

      const pct = Number(p.percentage);
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        throw new BadRequestException(
          'Cada porcentaje de participación debe ser mayor a 0 y menor o igual a 100',
        );
      }
      totalPercentage += pct;
    }

    // Normalización de punto flotante para 2 decimales
    const roundedTotal = Math.round(totalPercentage * 100) / 100;
    if (roundedTotal > 100.0) {
      throw new BadRequestException(
        `La suma de los porcentajes de participación (${roundedTotal}%) no puede superar el 100.00%`,
      );
    }
  }

  async findAll(
    tenantId: string,
    search?: string,
    categoryId?: string,
    isActive?: boolean,
  ) {
    const trimmed = search?.trim();
    return this.prisma.article.findMany({
      where: {
        tenantId,
        ...(categoryId ? { categoryId } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(trimmed
          ? {
              OR: [
                { code: { contains: trimmed, mode: 'insensitive' } },
                { name: { contains: trimmed, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        participants: {
          include: {
            entity: {
              select: { id: true, code: true, name: true, status: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const article = await this.prisma.article.findFirst({
      where: { id, tenantId },
      include: {
        category: {
          select: { id: true, name: true },
        },
        participants: {
          include: {
            entity: {
              select: { id: true, code: true, name: true, status: true },
            },
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException(`Artículo con ID "${id}" no encontrado`);
    }

    return article;
  }

  async create(dto: CreateArticleDto, tenantId: string) {
    const trimmedCode = dto.code.trim();
    const trimmedName = dto.name.trim();

    // 1. Validar unicidad de código
    const existingCode = await this.prisma.article.findFirst({
      where: {
        tenantId,
        code: { equals: trimmedCode, mode: 'insensitive' },
      },
    });
    if (existingCode) {
      throw new ConflictException(
        `Ya existe un artículo con el código "${trimmedCode}"`,
      );
    }

    // 2. Validar existencia de categoría en el tenant
    const category = await this.prisma.articleCategory.findFirst({
      where: { id: dto.categoryId, tenantId },
    });
    if (!category) {
      throw new NotFoundException(
        `La categoría seleccionada no existe o no pertenece a la organización`,
      );
    }

    // 3. Validar participantes y regla de suma <= 100%
    this.validateParticipants(dto.participants);

    if (dto.participants && dto.participants.length > 0) {
      const entityIds = dto.participants.map((p) => p.entityId);
      const existingEntities = await this.prisma.entity.findMany({
        where: { id: { in: entityIds }, tenantId },
        select: { id: true },
      });
      if (existingEntities.length !== entityIds.length) {
        throw new BadRequestException(
          'Uno o más participantes no existen en el catálogo de entidades de la organización',
        );
      }
    }

    // 4. Crear artículo y participantes en transacción atómica
    return this.prisma.$transaction(async (tx) => {
      const article = await tx.article.create({
        data: {
          tenantId,
          code: trimmedCode,
          name: trimmedName,
          categoryId: dto.categoryId,
          price1: new Prisma.Decimal(dto.price1),
          price2:
            dto.price2 !== undefined && dto.price2 !== null
              ? new Prisma.Decimal(dto.price2)
              : null,
          price3:
            dto.price3 !== undefined && dto.price3 !== null
              ? new Prisma.Decimal(dto.price3)
              : null,
          price4:
            dto.price4 !== undefined && dto.price4 !== null
              ? new Prisma.Decimal(dto.price4)
              : null,
          appliesVat: dto.appliesVat ?? false,
          participants: dto.participants?.length
            ? {
                create: dto.participants.map((p) => ({
                  tenantId,
                  entityId: p.entityId,
                  percentage: new Prisma.Decimal(p.percentage),
                })),
              }
            : undefined,
        },
        include: {
          category: { select: { id: true, name: true } },
          participants: {
            include: {
              entity: {
                select: { id: true, code: true, name: true, status: true },
              },
            },
          },
        },
      });

      return article;
    });
  }

  async update(id: string, dto: UpdateArticleDto, tenantId: string) {
    const existing = await this.findOne(id, tenantId);

    if (dto.code && dto.code.trim().toUpperCase() !== existing.code.toUpperCase()) {
      const codeTaken = await this.prisma.article.findFirst({
        where: {
          tenantId,
          code: { equals: dto.code.trim(), mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (codeTaken) {
        throw new ConflictException(
          `El código de artículo "${dto.code.trim()}" ya está en uso`,
        );
      }
    }

    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const category = await this.prisma.articleCategory.findFirst({
        where: { id: dto.categoryId, tenantId },
      });
      if (!category) {
        throw new NotFoundException(
          `La categoría seleccionada no existe o no pertenece a la organización`,
        );
      }
    }

    if (dto.participants !== undefined) {
      this.validateParticipants(dto.participants);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.participants !== undefined) {
        await tx.articleParticipant.deleteMany({
          where: { articleId: id, tenantId },
        });

        if (dto.participants.length > 0) {
          const entityIds = dto.participants.map((p) => p.entityId);
          const validEntities = await tx.entity.findMany({
            where: { id: { in: entityIds }, tenantId },
            select: { id: true },
          });
          if (validEntities.length !== entityIds.length) {
            throw new BadRequestException(
              'Uno o más participantes seleccionados no existen en la organización',
            );
          }

          await tx.articleParticipant.createMany({
            data: dto.participants.map((p) => ({
              tenantId,
              articleId: id,
              entityId: p.entityId,
              percentage: new Prisma.Decimal(p.percentage),
            })),
          });
        }
      }

      return tx.article.update({
        where: { id },
        data: {
          ...(dto.code ? { code: dto.code.trim() } : {}),
          ...(dto.name ? { name: dto.name.trim() } : {}),
          ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
          ...(dto.price1 !== undefined
            ? { price1: new Prisma.Decimal(dto.price1) }
            : {}),
          ...(dto.price2 !== undefined
            ? {
                price2:
                  dto.price2 !== null ? new Prisma.Decimal(dto.price2) : null,
              }
            : {}),
          ...(dto.price3 !== undefined
            ? {
                price3:
                  dto.price3 !== null ? new Prisma.Decimal(dto.price3) : null,
              }
            : {}),
          ...(dto.price4 !== undefined
            ? {
                price4:
                  dto.price4 !== null ? new Prisma.Decimal(dto.price4) : null,
              }
            : {}),
          ...(typeof dto.isActive === 'boolean'
            ? { isActive: dto.isActive }
            : {}),
          ...(typeof dto.appliesVat === 'boolean'
            ? { appliesVat: dto.appliesVat }
            : {}),
        },
        include: {
          category: { select: { id: true, name: true } },
          participants: {
            include: {
              entity: {
                select: { id: true, code: true, name: true, status: true },
              },
            },
          },
        },
      });
    });
  }
}
