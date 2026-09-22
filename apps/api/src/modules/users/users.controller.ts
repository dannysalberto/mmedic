import { Controller, Get, Post, Put, Patch, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserStatusDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponse, UserRole } from '@mmedic/types';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios del inquilino paginados' })
  async findAll(@Request() req: any, @Query('page') page = 1, @Query('limit') limit = 10, @Query('search') search?: string, @Query('role') role?: UserRole): Promise<ApiResponse<any>> {
    const tenantId = req.tenantContext.tenantId;
    const data = await this.usersService.findAll(tenantId, +page, +limit, search, role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.usersService.findOne(id, req.tenantContext.tenantId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  async create(@Body() dto: CreateUserDto, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.usersService.create(dto, req.tenantContext.tenantId);
    return { success: true, data, message: 'Usuario creado exitosamente', timestamp: new Date().toISOString() };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar datos de usuario' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.usersService.update(id, dto, req.tenantContext.tenantId);
    return { success: true, data, message: 'Usuario actualizado exitosamente', timestamp: new Date().toISOString() };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar estado activo/inactivo de un usuario' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.usersService.updateStatus(id, dto, req.tenantContext.tenantId);
    return { success: true, data, message: 'Estado de usuario actualizado', timestamp: new Date().toISOString() };
  }
}
