import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nombre de la categoría del artículo', example: 'Consultas Médicas' })
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio' })
  @IsString({ message: 'El nombre de la categoría debe ser texto' })
  @Length(2, 100, { message: 'El nombre de la categoría debe tener entre 2 y 100 caracteres' })
  name: string;

  @ApiProperty({ description: 'Semilla o prefijo para códigos correlativos', example: 'CONS', required: false })
  @IsOptional()
  @IsString({ message: 'La semilla debe ser texto' })
  @Length(2, 6, { message: 'La semilla debe tener entre 2 y 6 caracteres' })
  @Matches(/^[A-Z0-9]{2,6}$/, { message: 'La semilla solo debe contener letras mayúsculas y números (sin espacios)' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  seed?: string;
}

export class UpdateCategoryDto {
  @ApiProperty({ description: 'Nombre de la categoría', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiProperty({ description: 'Semilla o prefijo para códigos correlativos', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 6)
  @Matches(/^[A-Z0-9]{2,6}$/, { message: 'La semilla solo debe contener letras mayúsculas y números (sin espacios)' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  seed?: string;
}
