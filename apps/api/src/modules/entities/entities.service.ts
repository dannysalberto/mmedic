import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { EntityStatus } from '@prisma/client';

export interface UpdateEntityDto {
  code?: string;
  name?: string;
  status?: EntityStatus;
}

@Injectable()
export class EntitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, search?: string, status?: EntityStatus) {
    const trimmed = search?.trim();
    const entities = await this.prisma.entity.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
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
        _count: {
          select: { articleParticipants: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return entities.map((e) => ({
      id: e.id,
      tenantId: e.tenantId,
      code: e.code,
      name: e.name,
      status: e.status,
      articlesCount: e._count.articleParticipants,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
  }

  async findByCode(code: string, tenantId: string) {
    const trimmedCode = code.trim();
    const entity = await this.prisma.entity.findFirst({
      where: {
        tenantId,
        code: { equals: trimmedCode, mode: 'insensitive' },
      },
      include: {
        _count: {
          select: { articleParticipants: true },
        },
      },
    });

    if (!entity) {
      throw new NotFoundException(`Entidad con código "${trimmedCode}" no encontrada`);
    }

    return {
      ...entity,
      articlesCount: entity._count.articleParticipants,
    };
  }

  async findOne(id: string, tenantId: string) {
    const entity = await this.prisma.entity.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { articleParticipants: true },
        },
      },
    });

    if (!entity) {
      throw new NotFoundException(`Entidad con ID "${id}" no encontrada`);
    }

    return {
      ...entity,
      articlesCount: entity._count.articleParticipants,
    };
  }

  async create(dto: CreateEntityDto, tenantId: string) {
    const trimmedCode = dto.code.trim();
    const trimmedName = dto.name.trim();

    const existing = await this.prisma.entity.findFirst({
      where: {
        tenantId,
        code: { equals: trimmedCode, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictException(`Ya existe una entidad con el código "${trimmedCode}"`);
    }

    return this.prisma.entity.create({
      data: {
        tenantId,
        code: trimmedCode,
        name: trimmedName,
        status: dto.status || EntityStatus.ACTIVE,
      },
    });
  }

  async update(id: string, dto: UpdateEntityDto, tenantId: string) {
    const existing = await this.findOne(id, tenantId);

    if (dto.code && dto.code.trim() !== existing.code) {
      const trimmedCode = dto.code.trim();
      const codeDuplicate = await this.prisma.entity.findFirst({
        where: {
          tenantId,
          code: { equals: trimmedCode, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (codeDuplicate) {
        throw new ConflictException(`Ya existe otra entidad con el código "${trimmedCode}"`);
      }
    }

    return this.prisma.entity.update({
      where: { id },
      data: {
        ...(dto.code ? { code: dto.code.trim() } : {}),
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const entity = await this.findOne(id, tenantId);

    if (entity.articlesCount > 0) {
      throw new BadRequestException(
        `No es posible eliminar la entidad "${entity.name}" porque está vinculada a ${entity.articlesCount} artículo(s). Desasóciela previamente o marque su estado como INACTIVA.`
      );
    }

    await this.prisma.entity.delete({
      where: { id },
    });

    return { id, deleted: true };
  }

  async findDuplicates(tenantId: string) {
    const all = await this.findAll(tenantId);
    const groupsMap = new Map<string, typeof all>();

    for (const item of all) {
      const norm = this.normalizeName(item.name);
      if (!norm) continue;
      const list = groupsMap.get(norm) || [];
      list.push(item);
      groupsMap.set(norm, list);
    }

    const duplicates: { normalizedName: string; entities: typeof all; matchScore: number }[] = [];
    for (const [normalizedName, entities] of groupsMap.entries()) {
      if (entities.length > 1) {
        duplicates.push({
          normalizedName,
          entities,
          matchScore: 95,
        });
      }
    }

    return duplicates;
  }

  async merge(primaryId: string, secondaryId: string, tenantId: string) {
    if (primaryId === secondaryId) {
      throw new BadRequestException('No se puede fusionar una entidad consigo misma');
    }

    const primary = await this.findOne(primaryId, tenantId);
    const secondary = await this.findOne(secondaryId, tenantId);

    await this.prisma.$transaction(async (tx) => {
      const secondaryParticipants = await tx.articleParticipant.findMany({
        where: { entityId: secondaryId },
      });

      for (const p of secondaryParticipants) {
        const primaryParticipant = await tx.articleParticipant.findFirst({
          where: { articleId: p.articleId, entityId: primaryId },
        });

        if (primaryParticipant) {
          const newPerc = Number(primaryParticipant.percentage) + Number(p.percentage);
          await tx.articleParticipant.update({
            where: { id: primaryParticipant.id },
            data: { percentage: Math.min(newPerc, 100.0) },
          });
          await tx.articleParticipant.delete({
            where: { id: p.id },
          });
        } else {
          await tx.articleParticipant.update({
            where: { id: p.id },
            data: { entityId: primaryId },
          });
        }
      }

      await tx.entity.delete({
        where: { id: secondaryId },
      });
    });

    return this.findOne(primaryId, tenantId);
  }

  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(dr|dra|doctor|doctora|lic|ing|prof|sr|sra|c\.a|s\.a)\b/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }
}
