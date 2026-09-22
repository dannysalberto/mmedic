import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserStatusDto } from './dto/update-user.dto';
import { UserRole } from '@mmedic/types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, page = 1, limit = 10, search?: string, role?: UserRole) {
    const skip = (page - 1) * limit;
    const where: any = { tenantId };

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          specialPermissions: {
            include: { permission: true },
          },
        },
      }),
    ]);

    const items = users.map((u) => {
      const { passwordHash, ...safeUser } = u;
      return {
        ...safeUser,
        specialPermissionsCount: u.specialPermissions.length,
      };
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      include: {
        specialPermissions: {
          include: { permission: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async create(createUserDto: CreateUserDto, currentTenantId: string) {
    const tenantId = createUserDto.tenantId || currentTenantId;

    const existing = await this.prisma.user.findFirst({
      where: {
        tenantId,
        OR: [
          { username: createUserDto.username },
          { email: createUserDto.email },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('El nombre de usuario o correo electrónico ya está registrado en este inquilino');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        passwordHash,
        fullName: createUserDto.fullName,
        name: createUserDto.fullName,
        role: createUserDto.role,
        tenantId,
        isActive: true,
      },
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const data: any = {};
    if (updateUserDto.fullName !== undefined) {
      data.fullName = updateUserDto.fullName;
      data.name = updateUserDto.fullName;
    }
    if (updateUserDto.role !== undefined) {
      data.role = updateUserDto.role;
    }
    if (updateUserDto.isActive !== undefined) {
      data.isActive = updateUserDto.isActive;
    }
    if (updateUserDto.password) {
      data.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
    });

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
