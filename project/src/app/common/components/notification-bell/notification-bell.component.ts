import {Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef, signal} from '@angular/core';
import {Router} from '@angular/router';
import {NotificationApiService} from '../../services/notification-api.service';
import {Notification} from '../../models/Notification';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private notificationApiService = inject(NotificationApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  readonly unreadCount = signal<number>(0);
  readonly showDropdown = signal<boolean>(false);
  readonly notifications = signal<Notification[]>([]);
  readonly isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.notificationApiService.startPolling();
    
    this.notificationApiService.unreadCount$.subscribe(count => {
      this.unreadCount.set(count);
      this.cdr.markForCheck();
    });

    this.notificationApiService.refreshUnreadCount();
    
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.notificationApiService.stopPolling();
  }

  toggleDropdown(): void {
    const current = this.showDropdown();
    this.showDropdown.set(!current);
    
    if (!current) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    this.cdr.markForCheck();
    
    this.notificationApiService.getNotifications(0, 10).subscribe({
      next: (page) => {
        this.notifications.set(page.content);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    
    if (notification.isRead) {
      return;
    }

    this.notificationApiService.markAsRead(notification.notificationId).subscribe({
      next: () => {
        const updated = {...notification, isRead: true};
        const current = this.notifications();
        const index = current.findIndex(n => n.notificationId === notification.notificationId);
        if (index !== -1) {
          current[index] = updated;
          this.notifications.set([...current]);
        }
        
        this.notificationApiService.refreshUnreadCount();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error marking notification as read:', err);
      }
    });
  }

  navigateToNotification(notification: Notification): void {
    if (!notification.isRead) {
      this.markAsRead(notification, new Event('click'));
    }

    switch (notification.notificationType) {
      case 'EXAM':
        if (notification.relatedId) {
          void this.router.navigate(['/main/my-test']);
        }
        break;
      case 'ASSIGNMENT':
      case 'ASSIGNMENT_DEADLINE':
      case 'POST':
      case 'COMMENT_REPLY':
      case 'CLASS_JOIN_REQUEST':
      case 'CLASS_JOIN_APPROVED':
      case 'CLASS':
        if (notification.classId) {
          void this.router.navigate(['/main/class-detail', notification.classId]);
        }
        break;
      default:
        void this.router.navigate(['/main/notifications']);
    }
    
    this.showDropdown.set(false);
  }

  navigateToNotificationsPage(): void {
    void this.router.navigate(['/main/notifications']);
    this.showDropdown.set(false);
  }

  formatDate(dateString: string): string {
    let normalizedDateString = dateString;
    const timezonePattern = /[+-]\d{2}:\d{2}$/;
    if (!dateString.endsWith('Z') && !timezonePattern.exec(dateString)) {
      normalizedDateString = dateString + 'Z';
    }
    
    const date = new Date(normalizedDateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  }
}

