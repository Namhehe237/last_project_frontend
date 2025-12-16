import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NotificationData {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new BehaviorSubject<NotificationData | null>(null);
  notification$ = this.notificationSubject.asObservable();

  show(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) {
    this.notificationSubject.next({ message, type, duration });
  }

  clear() {
    this.notificationSubject.next(null);
  }
} 