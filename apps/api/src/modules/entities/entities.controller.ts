import { Controller, Get, Post, Put, Delete, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EntitiesService, UpdateEntityDto } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponse } from '@mmedic/types';
import { EntityStatus } from '@prisma/client';

@ApiTags('Entities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('entities')
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar entidades participantes' })
  async findAll(@Request() req: any, @Query('search') search?: string, @Query('status') status?: EntityStatus): Promise<ApiResponse<any>> {
    const data = await this.entitiesService.findAll(req.tenantContext?.tenantId || 'default-clinic', search, status);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('duplicates')
  @ApiOperation({ summary: 'Detectar entidades potencialmente duplicadas' })
  async findDuplicates(@Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.entitiesService.findDuplicates(req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('merge')
  @ApiOperation({ summary: 'Fusionar entidad secundaria dentro de entidad principal' })
  async merge(@Body() body: { primaryEntityId: string; secondaryEntityId: string }, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.entitiesService.merge(body.primaryEntityId, body.secondaryEntityId, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, message: 'Entidades fusionadas exitosamente', timestamp: new Date().toISOString() };
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Buscar entidad por código único' })
  async findByCode(@Param('code') code: string, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.entitiesService.findByCode(code, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener entidad por ID' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.entitiesService.findOne(id, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva entidad participante' })
  async create(@Body() dto: CreateEntityDto, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.entitiesService.create(dto, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, message: 'Entidad participante creada exitosamente', timestamp: new Date().toISOString() };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una entidad participante' })
  async update(@Param('id') id: string, @Body() dto: UpdateEntityDto, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.entitiesService.update(id, dto, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, message: 'Entidad actualizada exitosamente', timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una entidad participante (si no tiene artículos)' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.entitiesService.remove(id, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, message: 'Entidad eliminada exitosamente', timestamp: new Date().toISOString() };
  }
}
