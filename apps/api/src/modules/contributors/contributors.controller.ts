import { Controller, Get, Post, Put, Delete, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContributorsService, UpdateContributorDto } from './contributors.service';
import { CreateContributorDto } from './dto/create-contributor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponse } from '@mmedic/types';
import { ContributorStatus } from '@prisma/client';

@ApiTags('Contributors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contributors')
export class ContributorsController {
  constructor(private readonly contributorsService: ContributorsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar colaboradores' })
  async findAll(@Request() req: any, @Query('search') search?: string, @Query('status') status?: ContributorStatus): Promise<ApiResponse<any>> {
    const data = await this.contributorsService.findAll(req.tenantContext?.tenantId || 'default-clinic', search, status);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('duplicates')
  @ApiOperation({ summary: 'Detectar colaboradores potencialmente duplicados' })
  async findDuplicates(@Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.contributorsService.findDuplicates(req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('merge')
  @ApiOperation({ summary: 'Fusionar colaborador secundario en colaborador principal' })
  async merge(@Body() body: { primaryContributorId: string; secondaryContributorId: string }, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.contributorsService.merge(body.primaryContributorId, body.secondaryContributorId, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, message: 'Colaboradores fusionados exitosamente', timestamp: new Date().toISOString() };
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Buscar colaborador por código único' })
  async findByCode(@Param('code') code: string, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.contributorsService.findByCode(code, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener colaborador por ID' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.contributorsService.findOne(id, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo colaborador' })
  async create(@Body() dto: CreateContributorDto, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.contributorsService.create(dto, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, message: 'Colaborador creado exitosamente', timestamp: new Date().toISOString() };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un colaborador existente' })
  async update(@Param('id') id: string, @Body() dto: UpdateContributorDto, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.contributorsService.update(id, dto, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, message: 'Colaborador actualizado exitosamente', timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un colaborador' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.contributorsService.remove(id, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, message: 'Colaborador eliminado exitosamente', timestamp: new Date().toISOString() };
  }
}
