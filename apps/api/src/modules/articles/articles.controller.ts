import { Controller, Get, Post, Put, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponse } from '@mmedic/types';

@ApiTags('Articles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar artículos con filtros' })
  async findAll(@Request() req: any, @Query('search') s?: string, @Query('categoryId') cat?: string, @Query('isActive') act?: boolean): Promise<ApiResponse<any>> {
    const data = await this.articlesService.findAll(req.tenantContext?.tenantId || 'default-clinic', s, cat, act);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener artículo por ID' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.articlesService.findOne(id, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo artículo con hasta 4 precios y participantes' })
  async create(@Body() dto: CreateArticleDto, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.articlesService.create(dto, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, message: 'Artículo registrado exitosamente', timestamp: new Date().toISOString() };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un artículo existente' })
  async update(@Param('id') id: string, @Body() dto: UpdateArticleDto, @Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.articlesService.update(id, dto, req.tenantContext?.tenantId || 'default-clinic');
    return { success: true, data, message: 'Artículo actualizado exitosamente', timestamp: new Date().toISOString() };
  }
}
