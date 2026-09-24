import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateArticleDto } from './create-article.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @ApiPropertyOptional({ description: 'Estado activo/inactivo del artículo', default: true })
  @IsOptional()
  @IsBoolean({ message: 'El estado isActive debe ser booleano' })
  isActive?: boolean;
}
