export type UserRole =
  | 'ROL_SUPERADMIN'
  | 'ROL_ADMIN'
  | 'ROL_MEDICO'
  | 'ROL_CAJERO'
  | 'ROL_GERENCIA';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialPermission {
  id: string;
  code: string;
  name: string;
  description: string;
  module: string;
  isSystem: boolean;
  createdAt: string;
}

export interface UserSpecialPermission {
  id: string;
  userId: string;
  permissionId: string;
  grantedBy: string;
  grantedAt: string;
  permission?: SpecialPermission;
}

export interface User {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  specialPermissions?: UserSpecialPermission[];
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  dni: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone?: string | null;
  email?: string | null;
  bloodType?: string | null;
  allergies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  dateTime: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string | null;
  patient?: Patient;
  doctor?: User;
  createdAt: string;
  updatedAt: string;
}

export interface SystemErrorLog {
  id: string;
  fileName: string;
  lineNumber: number;
  errorMessage: string;
  errorDescription?: string | null;
  userId?: string | null;
  errorType: string;
  createdAt: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  user: User;
  permissions: string[];
}

export interface CheckPermissionDto {
  userId: string;
  permission: string;
}

export interface CheckPermissionResponseData {
  userId: string;
  permission: string;
  hasPermission: boolean;
  grantedVia: 'SUPERADMIN' | 'ROLE_DEFAULT' | 'SPECIAL_PERMISSION' | 'NONE';
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  tenantId?: string;
}

export interface UpdateUserDto {
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
  password?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  service: string;
  version: string;
  uptime: number;
  database: 'connected' | 'disconnected';
  timestamp: string;
}
