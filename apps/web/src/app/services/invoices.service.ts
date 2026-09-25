import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Invoice,
  InvoiceWithDetails,
  CreateInvoiceDto,
  CreateInvoicePaymentDto,
  VoidInvoiceDto,
  InvoiceStatus,
  ApiResponse,
} from '@mmedic/types';
import { getApiBaseUrl } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InvoicesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${getApiBaseUrl()}/invoices`;

  readonly invoices = signal<InvoiceWithDetails[]>([]);
  readonly loading = signal<boolean>(false);

  getInvoices(status?: InvoiceStatus, search?: string): Observable<ApiResponse<InvoiceWithDetails[]>> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    this.loading.set(true);
    return this.http.get<ApiResponse<InvoiceWithDetails[]>>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          if (res.success && res.data) {
            this.invoices.set(res.data);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      }),
    );
  }

  getInvoiceById(id: string): Observable<ApiResponse<InvoiceWithDetails>> {
    return this.http.get<ApiResponse<InvoiceWithDetails>>(`${this.apiUrl}/${id}`);
  }

  createInvoice(dto: CreateInvoiceDto): Observable<ApiResponse<InvoiceWithDetails>> {
    return this.http.post<ApiResponse<InvoiceWithDetails>>(this.apiUrl, dto).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.invoices.update((current) => [res.data, ...current]);
        }
      }),
    );
  }

  voidInvoice(id: string, reason: string): Observable<ApiResponse<InvoiceWithDetails>> {
    const dto: VoidInvoiceDto = { reason };
    return this.http.patch<ApiResponse<InvoiceWithDetails>>(`${this.apiUrl}/${id}/void`, dto).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.invoices.update((current) =>
            current.map((inv) => (inv.id === id ? { ...inv, status: 'VOIDED' as const } : inv)),
          );
        }
      }),
    );
  }

  addPayment(invoiceId: string, dto: CreateInvoicePaymentDto): Observable<ApiResponse<InvoiceWithDetails>> {
    return this.http.post<ApiResponse<InvoiceWithDetails>>(`${this.apiUrl}/${invoiceId}/payments`, dto);
  }

  deletePayment(invoiceId: string, paymentId: string): Observable<ApiResponse<InvoiceWithDetails>> {
    return this.http.delete<ApiResponse<InvoiceWithDetails>>(`${this.apiUrl}/${invoiceId}/payments/${paymentId}`);
  }

  sendEmail(id: string): Observable<ApiResponse<{ sent: boolean; message: string }>> {
    return this.http.post<ApiResponse<{ sent: boolean; message: string }>>(`${this.apiUrl}/${id}/send-email`, {});
  }
}
