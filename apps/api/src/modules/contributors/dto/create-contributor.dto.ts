import { IsNotEmpty, IsString, IsOptional, IsEnum, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContributorStatus } from '@prisma/client';

export class CreateContributorDto {
  @ApiProperty({ description: 'Código único del colaborador/profesional', example: 'MED-001' })
  @IsNotEmpty({ message: 'El código del colaborador es obligatorio' })
  @IsString({ message: 'El código debe ser texto' })
  @Length(1, 50, { message: 'El código debe tener entre 1 y 50 caracteres' })
  code: string;

  @ApiProperty({ description: 'Nombre completo del profesional o técnico', example: 'Dr. Roberto Mendoza' })
  @IsNotEmpty({ message: 'El nombre del colaborador es obligatorio' })
  @IsString({ message: 'El nombre debe ser texto' })
  @Length(2, 150, { message: 'El nombre debe tener entre 2 y 150 caracteres' })
  name: string;

  @ApiPropertyOptional({ description: 'Estado del colaborador', enum: ContributorStatus, default: ContributorStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ContributorStatus, { message: 'El estado debe ser ACTIVE o INACTIVE' })
  status?: ContributorStatus;

  @ApiPropertyOptional({ description: 'ID de la entidad colaboradora vinculada', example: 'uuid-123' })
  @IsOptional()
  @IsString({ message: 'El ID de entidad debe ser texto' })
  entityId?: string;
}
