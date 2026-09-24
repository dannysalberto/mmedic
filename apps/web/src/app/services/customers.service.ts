import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Customer, CreateCustomerDto, UpdateCustomerDto, ApiResponse } from '@mmedic/types';

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/customers';

  readonly customers = signal<Customer[]>([]);
  readonly loading = signal<boolean>(false);

  getCustomers(search?: string): Observable<ApiResponse<Customer[]>> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    this.loading.set(true);
    return this.http.get<ApiResponse<Customer[]>>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          if (res.success && res.data) {
            this.customers.set(res.data);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      }),
    );
  }

  getCustomerByTaxId(taxId: string): Observable<ApiResponse<Customer | null>> {
    return this.http.get<ApiResponse<Customer | null>>(`${this.apiUrl}/by-tax-id/${encodeURIComponent(taxId.trim())}`);
  }

  getCustomerById(id: string): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.apiUrl}/${id}`);
  }

  createCustomer(dto: CreateCustomerDto): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(this.apiUrl, dto).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.customers.update((current) => [res.data, ...current]);
        }
      }),
    );
  }

  updateCustomer(id: string, dto: UpdateCustomerDto): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.customers.update((current) =>
            current.map((c) => (c.id === id ? res.data : c))
          );
        }
      }),
    );
  }

  deleteCustomer(id: string): Observable<ApiResponse<{ id: string }>> {
    return this.http.delete<ApiResponse<{ id: string }>>(`${this.apiUrl}/${id}`).pipe(
      tap((res) => {
        if (res.success) {
          this.customers.update((current) => current.filter((c) => c.id !== id));
        }
      }),
    );
  }
}
