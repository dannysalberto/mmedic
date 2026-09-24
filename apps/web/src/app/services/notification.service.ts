import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface PushNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _notifications = signal<PushNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();
  private timers = new Map<string, any>();

  show(notification: Omit<PushNotification, 'id'>): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newNotification: PushNotification = {
      ...notification,
      id,
      duration: notification.duration ?? (notification.type === 'error' ? 5000 : 3500)
    };

    this._notifications.update(list => [...list, newNotification]);

    if (newNotification.duration && newNotification.duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, newNotification.duration);
      this.timers.set(id, timer);
    }

    return id;
  }

  success(title: string, message: string, duration = 3500): string {
    return this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message: string, duration = 5000): string {
    return this.show({ type: 'error', title, message, duration });
  }

  warning(title: string, message: string, duration = 4000): string {
    return this.show({ type: 'warning', title, message, duration });
  }

  info(title: string, message: string, duration = 3500): string {
    return this.show({ type: 'info', title, message, duration });
  }

  dismiss(id: string): void {
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id));
      this.timers.delete(id);
    }
    this._notifications.update(list => list.filter(item => item.id !== id));
  }
}
