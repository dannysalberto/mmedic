import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@mmedic/types';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEnum(['ROL_SUPERADMIN', 'ROL_ADMIN', 'ROL_MEDICO', 'ROL_CAJERO', 'ROL_GERENCIA'])
  @IsOptional()
  role?: UserRole;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateUserStatusDto {
  @IsBoolean()
  isActive: boolean;
}
