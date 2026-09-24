import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoicesService } from '../../../services/invoices.service';
import { NotificationService } from '../../../services/notification.service';
import { InvoiceWithDetails } from '@mmedic/types';

@Component({
  selector: 'app-invoice-preview-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-preview-modal.component.html',
  styleUrls: ['./invoice-preview-modal.component.css'],
})
export class InvoicePreviewModalComponent {
  private readonly invoicesService = inject(InvoicesService);
  private readonly notificationService = inject(NotificationService);

  @Input({ required: true }) invoice!: InvoiceWithDetails;
  @Output() closed = new EventEmitter<void>();

  readonly isSendingEmail = signal<boolean>(false);

  close(): void {
    this.closed.emit();
  }

  printInvoice(): void {
    window.print();
  }

  shareWhatsApp(): void {
    const phone = this.invoice.customer.phone.replace(/[^0-9]/g, '');
    const text =
      `*MMedic - Factura N° ${this.invoice.invoiceNumber}*\n` +
      `Cliente: ${this.invoice.customer.name} (RIF: ${this.invoice.customer.taxId})\n` +
      `Fecha: ${new Date(this.invoice.issueDate).toLocaleDateString()}\n` +
      `Total Facturado: $${Number(this.invoice.total).toFixed(3)}\n` +
      `Total Pagado: $${Number(this.invoice.totalPaid).toFixed(3)}\n` +
      `Estatus: ${this.invoice.status}\n\n` +
      `¡Gracias por su preferencia!`;

    const encoded = encodeURIComponent(text);
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  }

  sendEmail(): void {
    if (!this.invoice.customer.email) {
      this.notificationService.error(
        'Sin correo',
        'El cliente no tiene un correo electrónico registrado en su ficha fiscal',
      );
      return;
    }

    this.isSendingEmail.set(true);
    this.invoicesService.sendEmail(this.invoice.id).subscribe({
      next: (res) => {
        this.isSendingEmail.set(false);
        this.notificationService.success('Factura enviada', res.message || 'Correo despachado');
      },
      error: (err) => {
        this.isSendingEmail.set(false);
        this.notificationService.error('Error al enviar correo', err.error?.message || 'Error inesperado');
      },
    });
  }
}
