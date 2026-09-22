import { Controller, Get, Post, Delete, Param, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { AssignPermissionDto, CheckPermissionDto } from './dto/permission.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponse } from '@mmedic/types';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener catálogo de permisos especiales' })
  async getCatalog(): Promise<ApiResponse<any>> {
    const data = await this.permissionsService.findAll();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener permisos de un usuario' })
  async getUserPermissions(@Param('userId') userId: string): Promise<ApiResponse<any>> {
    const data = await this.permissionsService.getUserPermissions(userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('user/:userId')
  @ApiOperation({ summary: 'Asignar un permiso especial a un usuario' })
  async assignToUser(@Param('userId') userId: string, @Body() dto: AssignPermissionDto, @Request() req: any): Promise<ApiResponse<any>> {
    const grantedBy = req.user?.id || 'SYSTEM';
    const data = await this.permissionsService.assignPermission(userId, dto.permissionCode, grantedBy);
    return { success: true, data, message: 'Permiso asignado correctamente', timestamp: new Date().toISOString() };
  }

  @Delete('user/:userId/:code')
  @ApiOperation({ summary: 'Revocar un permiso especial a un usuario' })
  async revokeFromUser(@Param('userId') userId: string, @Param('code') code: string): Promise<ApiResponse<any>> {
    const data = await this.permissionsService.revokePermission(userId, code);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('check')
  @ApiOperation({ summary: 'Verificar si un usuario cuenta con un permiso específico' })
  async checkPermission(@Body() dto: CheckPermissionDto): Promise<ApiResponse<any>> {
    const data = await this.permissionsService.checkUserPermission(dto.userId, dto.permission);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
