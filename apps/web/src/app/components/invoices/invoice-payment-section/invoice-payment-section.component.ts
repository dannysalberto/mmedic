import { Component, Output, EventEmitter, inject, signal, computed, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { InvoicesService } from '../../../services/invoices.service';
import { NotificationService } from '../../../services/notification.service';
import { round3Decimals } from '../../../services/invoices-calc.util';
import { InvoicePayment, PaymentMethod, CreateInvoicePaymentDto } from '@mmedic/types';

@Component({
  selector: 'app-invoice-payment-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-payment-section.component.html',
  styleUrls: ['./invoice-payment-section.component.css'],
})
export class InvoicePaymentSectionComponent {
  private readonly authService = inject(AuthService);
  private readonly invoicesService = inject(InvoicesService);
  private readonly notificationService = inject(NotificationService);

  readonly totalInvoice = input<number>(0);
  readonly invoiceId = input<string | null>(null); // Si existe, opera contra el backend
  readonly existingPayments = input<InvoicePayment[]>([]);
  @Output() initialPaymentsChanged = new EventEmitter<CreateInvoicePaymentDto[]>();

  readonly isAdmin = this.authService.isAdmin;

  // Lista local para facturas nuevas
  readonly localPayments = signal<CreateInvoicePaymentDto[]>([]);
  // Pagos actualizados recibidos del servidor si estamos en modo edición
  readonly serverPayments = signal<InvoicePayment[] | null>(null);

  // Campos para nuevo pago
  readonly selectedMethod = signal<PaymentMethod>('CASH');
  readonly amountInput = signal<number | null>(null);
  readonly receivedAmountInput = signal<number | null>(null);
  readonly referenceInput = signal<string>('');
  readonly isSubmitting = signal<boolean>(false);

  // Modal de confirmación para eliminar pago
  readonly paymentToDelete = signal<{ id: string; amount: number } | null>(null);

  // Computeds
  readonly currentPaymentsList = computed(() => {
    if (this.invoiceId()) {
      return this.serverPayments() ?? this.existingPayments();
    }
    return this.localPayments();
  });

  readonly totalPaid = computed(() => {
    return round3Decimals(
      this.currentPaymentsList().reduce((sum, p) => sum + Number(p.amount), 0),
    );
  });

  readonly pendingBalance = computed(() => {
    return Math.max(0, round3Decimals(Number(this.totalInvoice()) - this.totalPaid()));
  });

  readonly changeCalculated = computed(() => {
    if (this.selectedMethod() !== 'CASH') return 0;
    const received = this.receivedAmountInput() || 0;
    const amount = this.amountInput() || 0;
    if (received > amount) {
      return round3Decimals(received - amount);
    }
    return 0;
  });

  constructor() {
    // Si aún no se ha escrito un monto a imputar y cambia el saldo pendiente, sugerirlo
    effect(
      () => {
        const pending = this.pendingBalance();
        const currentAmount = this.amountInput();
        if (pending > 0 && (currentAmount === null || currentAmount === 0)) {
          this.amountInput.set(pending);
        }
      },
      { allowSignalWrites: true },
    );
  }

  fillPendingBalance(): void {
    const pending = this.pendingBalance();
    if (pending > 0) {
      this.amountInput.set(pending);
    }
  }

  addPayment(): void {
    const amount = Number(this.amountInput());
    if (!amount || amount <= 0) {
      this.notificationService.error('Monto inválido', 'El monto a cobrar debe ser mayor a 0');
      return;
    }

    const method = this.selectedMethod();
    const received = method === 'CASH' ? this.receivedAmountInput() || null : null;
    const ref = this.referenceInput().trim() || undefined;

    const dto: CreateInvoicePaymentDto = {
      paymentMethod: method,
      amount: round3Decimals(amount),
      receivedAmount: received ? round3Decimals(received) : undefined,
      reference: ref,
    };

    const targetInvoiceId = this.invoiceId();
    if (targetInvoiceId) {
      // Registrar pago en backend
      this.isSubmitting.set(true);
      this.invoicesService.addPayment(targetInvoiceId, dto).subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success && res.data) {
            this.serverPayments.set(res.data.payments);
            this.notificationService.success('Pago registrado', `Monto: $${dto.amount}`);
            this.resetInputs();
          }
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.notificationService.error('Error al registrar pago', err.error?.message || 'Error inesperado');
        },
      });
    } else {
      // Guardar en cola local para nueva factura
      this.localPayments.update((curr) => [...curr, dto]);
      this.initialPaymentsChanged.emit(this.localPayments());
      this.notificationService.success('Pago añadido', `Monto: $${dto.amount}`);
      this.resetInputs();
    }
  }

  promptDeletePayment(paymentId: string, amount: number): void {
    if (!this.isAdmin()) {
      this.notificationService.error('Acceso denegado', 'Solo un administrador puede eliminar pagos');
      return;
    }
    this.paymentToDelete.set({ id: paymentId, amount });
  }

  cancelDelete(): void {
    this.paymentToDelete.set(null);
  }

  confirmDelete(): void {
    const target = this.paymentToDelete();
    if (!target) return;

    const targetInvoiceId = this.invoiceId();
    if (targetInvoiceId) {
      this.invoicesService.deletePayment(targetInvoiceId, target.id).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.serverPayments.set(res.data.payments);
            this.notificationService.success('Pago eliminado', 'El saldo ha sido recalculado');
            this.cancelDelete();
          }
        },
        error: (err) => {
          this.notificationService.error('Error al eliminar', err.error?.message || 'Error inesperado');
          this.cancelDelete();
        },
      });
    } else {
      // Eliminar de cola local por índice
      const idx = parseInt(target.id, 10);
      this.localPayments.update((curr) => curr.filter((_, i) => i !== idx));
      this.initialPaymentsChanged.emit(this.localPayments());
      this.cancelDelete();
    }
  }

  private resetInputs(): void {
    this.amountInput.set(this.pendingBalance() > 0 ? this.pendingBalance() : null);
    this.receivedAmountInput.set(null);
    this.referenceInput.set('');
  }
}
