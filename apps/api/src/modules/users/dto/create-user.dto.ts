import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@mmedic/types';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEnum(['ROL_SUPERADMIN', 'ROL_ADMIN', 'ROL_MEDICO', 'ROL_CAJERO', 'ROL_GERENCIA'])
  role: UserRole;

  @IsString()
  @IsOptional()
  tenantId?: string;
}
