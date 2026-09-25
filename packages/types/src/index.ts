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

// ==========================================
// ARTICLES, CATEGORIES & ENTITIES CONTRACTS
// ==========================================

export type EntityStatus = 'ACTIVE' | 'INACTIVE';

export interface ArticleCategory {
  id: string;
  tenantId?: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
}

export interface UpdateCategoryDto {
  name?: string;
}

export interface CategoryWithStats extends ArticleCategory {
  articlesCount: number;
}

export interface DuplicateCategoryGroup {
  normalizedName: string;
  categories: CategoryWithStats[];
  matchScore: number;
}

export interface MergeCategoriesDto {
  primaryCategoryId: string;
  secondaryCategoryId: string;
}

export interface Entity {
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntityDto {
  code: string;
  name: string;
  status?: EntityStatus;
}

export interface UpdateEntityDto {
  code?: string;
  name?: string;
  status?: EntityStatus;
}

export interface EntityWithStats extends Entity {
  articlesCount: number;
}

export interface DuplicateEntityGroup {
  normalizedName: string;
  entities: EntityWithStats[];
  matchScore: number;
}

export interface MergeEntitiesDto {
  primaryEntityId: string;
  secondaryEntityId: string;
}


export interface ArticleParticipantItemDto {
  entityId: string;
  percentage: number;
}

export interface ArticleParticipant {
  id: string;
  tenantId?: string;
  articleId: string;
  entityId: string;
  percentage: number;
  entity?: Entity;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  categoryId: string;
  category?: ArticleCategory;
  price1: number;
  price2?: number | null;
  price3?: number | null;
  price4?: number | null;
  isActive: boolean;
  appliesVat?: boolean;
  participants?: ArticleParticipant[];
  participantsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleDto {
  code: string;
  name: string;
  categoryId: string;
  price1: number;
  price2?: number | null;
  price3?: number | null;
  price4?: number | null;
  appliesVat?: boolean;
  participants?: ArticleParticipantItemDto[];
}

export interface UpdateArticleDto extends Partial<CreateArticleDto> {
  isActive?: boolean;
}

// ==========================================
// BILLING, INVOICES & PAYMENTS CONTRACTS
// ==========================================

export type InvoiceType = 'CASH' | 'CREDIT';
export type InvoiceStatus = 'PENDING' | 'PAID' | 'VOIDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'CASHEA' | 'BINANCE' | 'TRANSFER' | 'OTHER';
export type PriceType = 'PRICE_1' | 'PRICE_2' | 'PRICE_3' | 'PRICE_4';

export interface Customer {
  id: string;
  tenantId?: string;
  taxId: string;       // RIF / Cédula
  name: string;        // Nombre o Razón Social
  phone: string;
  address: string;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  taxId: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

export interface InvoiceItemParticipantNode {
  entityId: string;
  percentage: number;
}

export interface InvoiceItem {
  id: string;
  tenantId?: string;
  invoiceId: string;
  articleId: string;
  contributorId?: string | null; // Médico / Personal que ejecuta el servicio
  entityId?: string | null;      // Entidad asociada
  priceType: PriceType;
  quantity: number;
  basePrice: number;     // Precio unitario sin IVA
  vatAmount: number;     // Monto IVA unitario
  subtotal: number;      // Base + IVA
  total: number;         // Subtotal * Cantidad (a 3 decimales)
  participantsJson?: InvoiceItemParticipantNode[] | null;
  article?: {
    code: string;
    name: string;
    appliesVat: boolean;
  };
  contributor?: {
    code: string;
    name: string;
  };
  entity?: {
    code: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceItemDto {
  articleId: string;
  contributorId?: string;
  entityId?: string;
  priceType: PriceType;
  quantity: number;
}

export interface InvoicePayment {
  id: string;
  tenantId?: string;
  invoiceId: string;
  paymentMethod: PaymentMethod;
  amount: number;                 // Imputado a la factura
  receivedAmount?: number | null; // Entregado por el cliente
  changeAmount?: number | null;   // Vuelto
  reference?: string | null;
  paymentDate: string;
  receivedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoicePaymentDto {
  paymentMethod: PaymentMethod;
  amount: number;
  receivedAmount?: number;
  changeAmount?: number;
  reference?: string;
}

export interface Invoice {
  id: string;
  tenantId?: string;
  invoiceNumber: string;
  issueDate: string;
  customerId: string;
  type: InvoiceType;
  status: InvoiceStatus;
  subtotal: number;
  vatAmount: number;
  total: number;
  notes?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceWithDetails extends Invoice {
  customer: Customer;
  items: InvoiceItem[];
  payments: InvoicePayment[];
  totalPaid: number;
  balanceDue: number;
}

export interface CreateInvoiceDto {
  customerId?: string;                 // ID si el cliente ya existe
  newCustomer?: CreateCustomerDto;     // Creación inline si es nuevo
  type: InvoiceType;
  notes?: string;
  items: CreateInvoiceItemDto[];
  payments?: CreateInvoicePaymentDto[];
}

export interface VoidInvoiceDto {
  reason: string;
}

export * from './contributor';
export * from './customer';

export interface DatabasePoolMetrics {
  limit: number;
  activeQueries: number;
  totalQueries: number;
  totalErrors: number;
  retriedQueries?: number;
  saturationWarning: boolean;
  p95LatencyMs: number;
}

export interface DatabaseHealthInfo {
  status: 'connected' | 'degraded' | 'disconnected';
  latencyMs?: number;
  pool: DatabasePoolMetrics;
}

export interface DatabaseHealthResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  version: string;
  uptime: number;
  database: DatabaseHealthInfo;
  timestamp: string;
}
