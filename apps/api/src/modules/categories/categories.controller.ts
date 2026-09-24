import { Controller, Get, Post, Put, Delete, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CategoriesService, UpdateCategoryDto } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponse, MergeCategoriesDto } from '@mmedic/types';

@ApiTags('Article Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('article-categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorías de artículos con conteo de artículos' })
  async findAll(@Request() req: any, @Query('search') search?: string): Promise<ApiResponse<any>> {
    const tenantId = req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.categoriesService.findAll(tenantId, search);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('duplicates')
  @ApiOperation({ summary: 'Detectar categorías potencialmente duplicadas' })
  async findDuplicates(@Request() req: any): Promise<ApiResponse<any>> {
    const tenantId = req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.categoriesService.findDuplicates(tenantId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('merge')
  @ApiOperation({ summary: 'Fusionar categoría secundaria dentro de categoría principal' })
  async merge(@Body() body: MergeCategoriesDto, @Request() req: any): Promise<ApiResponse<any>> {
    const tenantId = req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.categoriesService.merge(body.primaryCategoryId, body.secondaryCategoryId, tenantId);
    return { success: true, data, message: 'Categorías fusionadas exitosamente', timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener categoría por ID' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<any>> {
    const tenantId = req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.categoriesService.findOne(id, tenantId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva categoría de artículo' })
  async create(@Body() dto: CreateCategoryDto, @Request() req: any): Promise<ApiResponse<any>> {
    const tenantId = req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.categoriesService.create(dto, tenantId);
    return { success: true, data, message: 'Categoría creada exitosamente', timestamp: new Date().toISOString() };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar nombre de una categoría' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @Request() req: any): Promise<ApiResponse<any>> {
    const tenantId = req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.categoriesService.update(id, dto, tenantId);
    return { success: true, data, message: 'Categoría actualizada exitosamente', timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar categoría (solo si no tiene artículos vinculados)' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<any>> {
    const tenantId = req.tenantContext?.tenantId || 'default-clinic';
    const data = await this.categoriesService.remove(id, tenantId);
    return { success: true, data, message: 'Categoría eliminada exitosamente', timestamp: new Date().toISOString() };
  }
}
