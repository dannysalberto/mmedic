import { IsNotEmpty, IsString, IsOptional, IsEnum, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityStatus } from '@prisma/client';

export class CreateEntityDto {
  @ApiProperty({ description: 'Código único de la entidad participante', example: 'MED-CIR-01' })
  @IsNotEmpty({ message: 'El código de la entidad es obligatorio' })
  @IsString({ message: 'El código debe ser texto' })
  @Length(1, 50, { message: 'El código debe tener entre 1 y 50 caracteres' })
  code: string;

  @ApiProperty({ description: 'Nombre o razón social de la entidad', example: 'Dr. Fernando Ruiz (Cirugía)' })
  @IsNotEmpty({ message: 'El nombre de la entidad es obligatorio' })
  @IsString({ message: 'El nombre debe ser texto' })
  @Length(2, 150, { message: 'El nombre debe tener entre 2 y 150 caracteres' })
  name: string;

  @ApiPropertyOptional({ description: 'Estado de la entidad', enum: EntityStatus, default: EntityStatus.ACTIVE })
  @IsOptional()
  @IsEnum(EntityStatus, { message: 'El estado debe ser ACTIVE o INACTIVE' })
  status?: EntityStatus;
}
