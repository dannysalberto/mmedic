/**
 * Contract: Invoices, Customers & Payments API Contracts
 * Single Source of Truth for @mmedic/types
 */

export type InvoiceType = 'CASH' | 'CREDIT';
export type InvoiceStatus = 'PENDING' | 'PAID' | 'VOIDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'CASHEA' | 'BINANCE' | 'TRANSFER' | 'OTHER';
export type PriceType = 'PRICE_1' | 'PRICE_2' | 'PRICE_3' | 'PRICE_4';

// ==========================================
// CUSTOMER CONTRACTS
// ==========================================

export interface Customer {
  id: string;
  tenantId?: string;
  taxId: string;       // RIF / Cédula
  name: string;        // Nombre / Razón Social
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

// ==========================================
// INVOICE ITEM CONTRACTS
// ==========================================

export interface InvoiceItem {
  id: string;
  tenantId?: string;
  invoiceId: string;
  articleId: string;
  entityId: string;      // Médico o entidad colaboradora
  priceType: PriceType;
  quantity: number;
  basePrice: number;     // Sin IVA
  vatAmount: number;     // Monto IVA unitario
  subtotal: number;      // Base + IVA
  total: number;         // Subtotal * Cantidad (3 decimales)
  article?: {
    code: string;
    name: string;
    appliesVat: boolean;
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
  entityId: string;
  priceType: PriceType;
  quantity: number;
}

// ==========================================
// INVOICE PAYMENT CONTRACTS
// ==========================================

export interface InvoicePayment {
  id: string;
  tenantId?: string;
  invoiceId: string;
  paymentMethod: PaymentMethod;
  amount: number;             // Imputado a la factura
  receivedAmount?: number | null; // Entregado por cliente (efectivo)
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
  reference?: string;
}

// ==========================================
// INVOICE CONTRACTS
// ==========================================

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
  payments?: CreateInvoicePaymentDto[]; // Pagos iniciales opcionales
}

export interface VoidInvoiceDto {
  reason: string;
}

// ==========================================
// REST ENDPOINTS REFERENCE
// ==========================================
/*
  CUSTOMERS:
  - GET    /api/v1/customers?search=...         -> Listar / buscar clientes por RIF o nombre
  - GET    /api/v1/customers/:id                -> Obtener cliente
  - POST   /api/v1/customers                    -> Crear cliente
  - PUT    /api/v1/customers/:id                -> Actualizar cliente

  INVOICES:
  - GET    /api/v1/invoices?status=...&search=... -> Listar facturas con filtros
  - GET    /api/v1/invoices/:id                 -> Detalle completo de factura
  - POST   /api/v1/invoices                     -> Crear factura (con items y cliente)
  - PATCH  /api/v1/invoices/:id/void            -> Anular factura (Solo Admin)
  - POST   /api/v1/invoices/:id/payments        -> Registrar nuevo pago a factura
  - DELETE /api/v1/invoices/:id/payments/:payId -> Eliminar pago recibido (Solo Admin)
  - POST   /api/v1/invoices/:id/send-email      -> Enviar comprobante por correo
*/
