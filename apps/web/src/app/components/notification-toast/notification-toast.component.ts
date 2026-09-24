import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.css']
})
export class NotificationToastComponent {
  private readonly notificationService = inject(NotificationService);
  readonly notifications = this.notificationService.notifications;

  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }
}
