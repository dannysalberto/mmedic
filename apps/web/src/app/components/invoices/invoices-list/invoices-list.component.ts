import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../header/header.component';
import { InvoicesService } from '../../../services/invoices.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { InvoicePreviewModalComponent } from '../invoice-preview-modal/invoice-preview-modal.component';
import { InvoicePaymentSectionComponent } from '../invoice-payment-section/invoice-payment-section.component';
import { Invoice, InvoiceStatus, InvoiceWithDetails } from '@mmedic/types';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    HeaderComponent,
    InvoicePreviewModalComponent,
    InvoicePaymentSectionComponent,
  ],
  templateUrl: './invoices-list.component.html',
  styleUrls: ['./invoices-list.component.css'],
})
export class InvoicesListComponent implements OnInit {
  private readonly invoicesService = inject(InvoicesService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly invoices = this.invoicesService.invoices;
  readonly loading = this.invoicesService.loading;
  readonly isAdmin = this.authService.isAdmin;

  // Filters
  readonly searchQuery = signal<string>('');
  readonly selectedStatus = signal<string>('ALL');

  // Modal states
  readonly previewInvoice = signal<InvoiceWithDetails | null>(null);
  readonly paymentInvoice = signal<InvoiceWithDetails | null>(null);
  readonly voidTargetInvoice = signal<Invoice | null>(null);
  readonly voidReason = signal<string>('');
  readonly isVoiding = signal<boolean>(false);

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    const statusParam =
      this.selectedStatus() !== 'ALL' ? (this.selectedStatus() as InvoiceStatus) : undefined;
    this.invoicesService.getInvoices(statusParam, this.searchQuery()).subscribe();
  }

  onFilterStatus(status: string): void {
    this.selectedStatus.set(status);
    this.loadInvoices();
  }

  onSearch(): void {
    this.loadInvoices();
  }

  openPreview(id: string): void {
    this.invoicesService.getInvoiceById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.previewInvoice.set(res.data);
        }
      },
      error: (err) => {
        this.notificationService.error('Error al cargar', err.error?.message || 'Error inesperado');
      },
    });
  }

  closePreview(): void {
    this.previewInvoice.set(null);
  }

  openPaymentModal(id: string): void {
    this.invoicesService.getInvoiceById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.paymentInvoice.set(res.data);
        }
      },
      error: (err) => {
        this.notificationService.error('Error al cargar', err.error?.message || 'Error inesperado');
      },
    });
  }

  closePaymentModal(): void {
    this.paymentInvoice.set(null);
    this.loadInvoices();
  }

  promptVoid(invoice: Invoice): void {
    if (!this.isAdmin()) {
      this.notificationService.error('Acceso restringido', 'Solo administradores pueden anular facturas');
      return;
    }
    this.voidTargetInvoice.set(invoice);
    this.voidReason.set('');
  }

  cancelVoid(): void {
    this.voidTargetInvoice.set(null);
    this.voidReason.set('');
  }

  confirmVoid(): void {
    const inv = this.voidTargetInvoice();
    const reason = this.voidReason().trim();
    if (!inv || !reason) {
      this.notificationService.error('Motivo requerido', 'Debe ingresar el motivo de anulación');
      return;
    }

    this.isVoiding.set(true);
    this.invoicesService.voidInvoice(inv.id, reason).subscribe({
      next: (res) => {
        this.isVoiding.set(false);
        if (res.success) {
          this.notificationService.success('Factura Anulada', `Comprobante ${inv.invoiceNumber} anulado`);
          this.cancelVoid();
          this.loadInvoices();
        }
      },
      error: (err) => {
        this.isVoiding.set(false);
        this.notificationService.error('Error al anular', err.error?.message || 'Error inesperado');
      },
    });
  }
}
