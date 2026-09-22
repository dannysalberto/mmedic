import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'superadmin', description: 'Nombre de usuario o correo electrónico' })
  @IsNotEmpty({ message: 'El nombre de usuario o correo es obligatorio' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'superadmin@123#', description: 'Contraseña del usuario' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString()
  password: string;
}
