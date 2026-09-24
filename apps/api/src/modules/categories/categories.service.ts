import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

export interface UpdateCategoryDto {
  name?: string;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // T004 — findAll with articlesCount + multi-tenant filter
  async findAll(tenantId: string, search?: string) {
    const trimmed = search?.trim();
    const rows = await this.prisma.articleCategory.findMany({
      where: {
        tenantId,
        ...(trimmed ? { name: { contains: trimmed, mode: 'insensitive' } } : {}),
      },
      include: { _count: { select: { articles: true } } },
      orderBy: { name: 'asc' },
    });

    return rows.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      articlesCount: r._count.articles,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  // T005 — findOne with articlesCount
  async findOne(id: string, tenantId: string) {
    const row = await this.prisma.articleCategory.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { articles: true } } },
    });
    if (!row) throw new NotFoundException(`Categoría con ID "${id}" no encontrada`);
    return { ...row, articlesCount: row._count.articles };
  }

  // T006 — create with uniqueness check
  async create(dto: CreateCategoryDto, tenantId: string) {
    const trimmedName = dto.name.trim();
    const existing = await this.prisma.articleCategory.findFirst({
      where: { tenantId, name: { equals: trimmedName, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException(`Ya existe una categoría con el nombre "${trimmedName}"`);
    }
    return this.prisma.articleCategory.create({ data: { tenantId, name: trimmedName } });
  }

  // T007 — update with uniqueness check
  async update(id: string, dto: UpdateCategoryDto, tenantId: string) {
    await this.findOne(id, tenantId);
    if (dto.name) {
      const trimmedName = dto.name.trim();
      const duplicate = await this.prisma.articleCategory.findFirst({
        where: { tenantId, name: { equals: trimmedName, mode: 'insensitive' }, id: { not: id } },
      });
      if (duplicate) {
        throw new ConflictException(`Ya existe otra categoría con el nombre "${trimmedName}"`);
      }
    }
    return this.prisma.articleCategory.update({
      where: { id },
      data: { ...(dto.name ? { name: dto.name.trim() } : {}) },
    });
  }

  // T008 — Safe Delete Rule
  async remove(id: string, tenantId: string) {
    const category = await this.findOne(id, tenantId);
    if (category.articlesCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar la categoría "${category.name}" porque está vinculada a ${category.articlesCount} artículo(s). Reasigne o desasocie los artículos previamente.`,
      );
    }
    await this.prisma.articleCategory.delete({ where: { id } });
    return { id, deleted: true };
  }

  // T009 — Duplicate detection by normalized name
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
    const duplicates: { normalizedName: string; categories: typeof all; matchScore: number }[] = [];
    for (const [normalizedName, categories] of groupsMap.entries()) {
      if (categories.length > 1) {
        duplicates.push({ normalizedName, categories, matchScore: 95 });
      }
    }
    return duplicates;
  }

  // T010 — Atomic merge via $transaction
  async merge(primaryId: string, secondaryId: string, tenantId: string) {
    if (primaryId === secondaryId) {
      throw new BadRequestException('No se puede fusionar una categoría consigo misma');
    }
    await this.findOne(primaryId, tenantId);
    await this.findOne(secondaryId, tenantId);

    await this.prisma.$transaction(async (tx) => {
      await tx.article.updateMany({ where: { categoryId: secondaryId }, data: { categoryId: primaryId } });
      await tx.articleCategory.delete({ where: { id: secondaryId } });
    });

    return this.findOne(primaryId, tenantId);
  }

  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }
}
