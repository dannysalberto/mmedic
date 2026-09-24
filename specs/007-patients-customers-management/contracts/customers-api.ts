/**
 * Contrato de API REST para Gestión de Clientes / Directorio de Pacientes
 */

import {
  ApiResponse,
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
} from '@mmedic/types';

export interface CustomersApiContract {
  /**
   * Obtiene el listado de clientes/pacientes con filtro de búsqueda opcional
   * GET /api/v1/customers?search=juan
   */
  getCustomers(search?: string): Promise<ApiResponse<Customer[]>>;

  /**
   * Obtiene la ficha de un cliente por su RIF / Cédula Fiscal
   * GET /api/v1/customers/by-tax-id/:taxId
   */
  getCustomerByTaxId(taxId: string): Promise<ApiResponse<Customer | null>>;

  /**
   * Obtiene el detalle de un cliente por su ID
   * GET /api/v1/customers/:id
   */
  getCustomerById(id: string): Promise<ApiResponse<Customer>>;

  /**
   * Registra un nuevo cliente / paciente
   * POST /api/v1/customers
   */
  createCustomer(dto: CreateCustomerDto): Promise<ApiResponse<Customer>>;

  /**
   * Actualiza los datos de un cliente / paciente existente
   * PUT /api/v1/customers/:id
   */
  updateCustomer(id: string, dto: UpdateCustomerDto): Promise<ApiResponse<Customer>>;

  /**
   * Elimina un cliente / paciente (siempre que no posea facturas asociadas)
   * DELETE /api/v1/customers/:id
   */
  deleteCustomer(id: string): Promise<ApiResponse<{ id: string }>>;
}
