import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  Min,
  Max,
  Length,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ArticleParticipantInputDto {
  @ApiProperty({ description: 'ID de la entidad participante', example: 'e1a2b3c4-0000-0000-0000-000000000001' })
  @IsNotEmpty({ message: 'El entityId es obligatorio' })
  @IsUUID('all', { message: 'El entityId debe ser un UUID válido' })
  entityId: string;

  @ApiProperty({ description: 'Porcentaje de participación', example: 45.5, minimum: 0.01, maximum: 100 })
  @IsNotEmpty({ message: 'El porcentaje es obligatorio' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El porcentaje debe ser un número con máximo 2 decimales' })
  @Min(0.01, { message: 'El porcentaje debe ser mayor a 0' })
  @Max(100, { message: 'El porcentaje no puede ser mayor a 100' })
  percentage: number;
}

export class CreateArticleDto {
  @ApiProperty({ description: 'Código único del artículo', example: 'CONS-001' })
  @IsNotEmpty({ message: 'El código de artículo es obligatorio' })
  @IsString({ message: 'El código debe ser texto' })
  @Length(1, 50, { message: 'El código debe tener entre 1 y 50 caracteres' })
  code: string;

  @ApiProperty({ description: 'Nombre o descripción del artículo', example: 'Consulta Médica General' })
  @IsNotEmpty({ message: 'El nombre del artículo es obligatorio' })
  @IsString({ message: 'El nombre debe ser texto' })
  @Length(2, 150, { message: 'El nombre debe tener entre 2 y 150 caracteres' })
  name: string;

  @ApiProperty({ description: 'ID de la categoría del artículo', example: 'c1a2b3c4-0000-0000-0000-000000000001' })
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  @IsUUID('all', { message: 'El categoryId debe ser un UUID válido' })
  categoryId: string;

  @ApiProperty({ description: 'Precio de venta 1 (Base obligatoria)', example: 35.0, minimum: 0 })
  @IsNotEmpty({ message: 'El Precio 1 es obligatorio' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El Precio 1 debe ser un número válido' })
  @Min(0, { message: 'El Precio 1 debe ser mayor o igual a 0' })
  price1: number;

  @ApiPropertyOptional({ description: 'Precio de venta 2 (Opcional)', example: 45.0, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El Precio 2 debe ser un número válido' })
  @Min(0, { message: 'El Precio 2 debe ser mayor o igual a 0' })
  price2?: number;

  @ApiPropertyOptional({ description: 'Precio de venta 3 (Opcional)', example: 50.0, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El Precio 3 debe ser un número válido' })
  @Min(0, { message: 'El Precio 3 debe ser mayor o igual a 0' })
  price3?: number;

  @ApiPropertyOptional({ description: 'Precio de venta 4 (Opcional)', example: 60.0, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El Precio 4 debe ser un número válido' })
  @Min(0, { message: 'El Precio 4 debe ser mayor o igual a 0' })
  price4?: number;

  @ApiPropertyOptional({ description: 'Indica si el artículo aplica IVA', example: true, default: false })
  @IsOptional()
  @IsBoolean({ message: 'appliesVat debe ser un valor booleano' })
  appliesVat?: boolean;

  @ApiPropertyOptional({ description: 'Lista de participantes con porcentaje de distribución', type: [ArticleParticipantInputDto] })
  @IsOptional()
  @IsArray({ message: 'Los participantes deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => ArticleParticipantInputDto)
  participants?: ArticleParticipantInputDto[];
}
