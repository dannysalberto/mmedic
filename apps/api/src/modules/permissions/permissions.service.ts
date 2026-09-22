import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckPermissionResponseData } from '@mmedic/types';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.specialPermission.findMany({
      orderBy: { module: 'asc' },
    });
  }

  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        specialPermissions: {
          include: { permission: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    return user.specialPermissions.map((sp) => sp.permission);
  }

  async assignPermission(userId: string, permissionCode: string, grantedBy: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    const permission = await this.prisma.specialPermission.findUnique({
      where: { code: permissionCode },
    });
    if (!permission) {
      throw new NotFoundException(`Permiso especial ${permissionCode} no existe`);
    }

    const existing = await this.prisma.userSpecialPermission.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.userSpecialPermission.create({
      data: {
        userId,
        permissionId: permission.id,
        grantedBy,
      },
      include: { permission: true },
    });
  }

  async revokePermission(userId: string, permissionCode: string) {
    const permission = await this.prisma.specialPermission.findUnique({
      where: { code: permissionCode },
    });
    if (!permission) {
      throw new NotFoundException(`Permiso especial ${permissionCode} no existe`);
    }

    const existing = await this.prisma.userSpecialPermission.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
    });

    if (!existing) {
      return { success: true, message: 'El usuario no tenía asignado este permiso' };
    }

    await this.prisma.userSpecialPermission.delete({
      where: { id: existing.id },
    });

    return { success: true, message: `Permiso ${permissionCode} revocado exitosamente` };
  }

  async checkUserPermission(userId: string, permissionCode: string): Promise<CheckPermissionResponseData> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        specialPermissions: {
          include: { permission: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return {
        userId,
        permission: permissionCode,
        hasPermission: false,
        grantedVia: 'NONE',
      };
    }

    if (user.role === 'ROL_SUPERADMIN') {
      return {
        userId,
        permission: permissionCode,
        hasPermission: true,
        grantedVia: 'SUPERADMIN',
      };
    }

    const hasSpecial = user.specialPermissions.some(
      (sp) => sp.permission.code === permissionCode,
    );

    if (hasSpecial) {
      return {
        userId,
        permission: permissionCode,
        hasPermission: true,
        grantedVia: 'SPECIAL_PERMISSION',
      };
    }

    return {
      userId,
      permission: permissionCode,
      hasPermission: false,
      grantedVia: 'NONE',
    };
  }
}
