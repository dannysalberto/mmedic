import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nombre de la categoría del artículo', example: 'Consultas Médicas' })
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio' })
  @IsString({ message: 'El nombre de la categoría debe ser texto' })
  @Length(2, 100, { message: 'El nombre de la categoría debe tener entre 2 y 100 caracteres' })
  name: string;
}
