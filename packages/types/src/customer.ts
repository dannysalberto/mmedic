export interface Customer {
  id: string;
  tenantId?: string;
  taxId: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  taxId: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
}

export interface UpdateCustomerDto {
  taxId?: string;
  name?: string;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
}
