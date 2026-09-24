import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContributorDto } from './dto/create-contributor.dto';
import { ContributorStatus } from '@prisma/client';

export interface UpdateContributorDto {
  code?: string;
  name?: string;
  status?: ContributorStatus;
  entityId?: string;
}

@Injectable()
export class ContributorsService {
  private readonly logger = new Logger(ContributorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, search?: string, status?: ContributorStatus) {
    const trimmed = search?.trim();
    const contributors = await this.prisma.contributor.findMany({
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
        entity: { select: { id: true, code: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    return contributors.map((c) => ({
      id: c.id,
      tenantId: c.tenantId,
      code: c.code,
      name: c.name,
      status: c.status,
      entityId: c.entityId,
      entity: c.entity,
      articlesCount: 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  async findByCode(code: string, tenantId: string) {
    const trimmedCode = code.trim();
    const contributor = await this.prisma.contributor.findFirst({
      where: {
        tenantId,
        code: { equals: trimmedCode, mode: 'insensitive' },
      },
      include: {
        entity: { select: { id: true, code: true, name: true } },
      },
    });

    if (!contributor) {
      throw new NotFoundException(`Colaborador con código "${trimmedCode}" no encontrado`);
    }

    return {
      ...contributor,
      articlesCount: 0,
    };
  }

  async findOne(id: string, tenantId: string) {
    const contributor = await this.prisma.contributor.findFirst({
      where: { id, tenantId },
      include: {
        entity: { select: { id: true, code: true, name: true } },
      },
    });

    if (!contributor) {
      throw new NotFoundException(`Colaborador con ID "${id}" no encontrado`);
    }

    return {
      ...contributor,
      articlesCount: 0,
    };
  }

  async create(dto: CreateContributorDto, tenantId: string) {
    const trimmedCode = dto.code.trim();
    const trimmedName = dto.name.trim();

    const existing = await this.prisma.contributor.findFirst({
      where: {
        tenantId,
        code: { equals: trimmedCode, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictException(`Ya existe un colaborador con el código "${trimmedCode}"`);
    }

    return this.prisma.contributor.create({
      data: {
        tenantId,
        code: trimmedCode,
        name: trimmedName,
        status: dto.status || ContributorStatus.ACTIVE,
        entityId: dto.entityId || null,
      },
      include: {
        entity: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async update(id: string, dto: UpdateContributorDto, tenantId: string) {
    const existing = await this.findOne(id, tenantId);

    if (dto.code && dto.code.trim() !== existing.code) {
      const trimmedCode = dto.code.trim();
      const codeDuplicate = await this.prisma.contributor.findFirst({
        where: {
          tenantId,
          code: { equals: trimmedCode, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (codeDuplicate) {
        throw new ConflictException(`Ya existe otro colaborador con el código "${trimmedCode}"`);
      }
    }

    return this.prisma.contributor.update({
      where: { id },
      data: {
        ...(dto.code ? { code: dto.code.trim() } : {}),
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.entityId !== undefined ? { entityId: dto.entityId || null } : {}),
      },
      include: {
        entity: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async remove(id: string, tenantId: string) {
    const contributor = await this.findOne(id, tenantId);

    if (contributor.articlesCount > 0) {
      throw new BadRequestException(
        `No es posible eliminar el colaborador "${contributor.name}" porque está vinculado a ${contributor.articlesCount} registro(s). Desasócielo previamente o marque su estado como INACTIVO.`
      );
    }

    await this.prisma.contributor.delete({
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

    const duplicates: { normalizedName: string; contributors: typeof all; matchScore: number }[] = [];
    for (const [normalizedName, contributors] of groupsMap.entries()) {
      if (contributors.length > 1) {
        duplicates.push({
          normalizedName,
          contributors,
          matchScore: 95,
        });
      }
    }

    return duplicates;
  }

  async merge(primaryId: string, secondaryId: string, tenantId: string) {
    if (primaryId === secondaryId) {
      throw new BadRequestException('No se puede fusionar un colaborador consigo mismo');
    }

    await this.findOne(primaryId, tenantId);
    await this.findOne(secondaryId, tenantId);

    await this.prisma.$transaction(async (tx) => {
      await tx.contributor.delete({
        where: { id: secondaryId },
      });
    });

    this.logger.log(`Merged contributor ${secondaryId} into ${primaryId} for tenant ${tenantId}`);
    return this.findOne(primaryId, tenantId);
  }

  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(dr|dra|doctor|doctora|lic|licenciado|licenciada|tec|tecnico|tecnica|esp|prof|enf)\b/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }
}
