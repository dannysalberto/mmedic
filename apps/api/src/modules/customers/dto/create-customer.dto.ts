import { IsNotEmpty, IsString, IsOptional, IsEmail, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ description: 'RIF o Cédula fiscal del cliente', example: 'J-12345678-9' })
  @IsNotEmpty({ message: 'El RIF / Cédula fiscal es obligatorio' })
  @IsString({ message: 'El RIF debe ser una cadena de texto' })
  @Length(3, 30, { message: 'El RIF debe tener entre 3 y 30 caracteres' })
  taxId: string;

  @ApiProperty({ description: 'Nombre o Razón Social del cliente', example: 'Distribuidora Médica C.A.' })
  @IsNotEmpty({ message: 'El nombre o razón social es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Length(2, 150, { message: 'El nombre debe tener entre 2 y 150 caracteres' })
  name: string;

  @ApiProperty({ description: 'Teléfono de contacto principal', example: '04141234567' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @IsString({ message: 'El teléfono debe ser texto' })
  @Length(5, 30, { message: 'El teléfono debe tener entre 5 y 30 caracteres' })
  phone: string;

  @ApiProperty({ description: 'Dirección fiscal física', example: 'Av. Libertador, Edif. Torre Salud, Piso 4' })
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @IsString({ message: 'La dirección debe ser texto' })
  @Length(3, 255, { message: 'La dirección debe tener entre 3 y 255 caracteres' })
  address: string;

  @ApiPropertyOptional({ description: 'Correo electrónico para facturación', example: 'contacto@distrimed.com' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  email?: string;
}
