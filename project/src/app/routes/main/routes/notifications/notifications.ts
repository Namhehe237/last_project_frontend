import {Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, signal} from '@angular/core';
import {Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {NotificationApiService} from '#common/services/notification-api.service';
import {Notification, NotificationPage} from '#common/models/Notification';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Notifications implements OnInit {
  private notificationApiService = inject(NotificationApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  readonly notifications = signal<Notification[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly currentPage = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly totalElements = signal<number>(0);
  pageSize = 20;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(page = 0): void {
    this.isLoading.set(true);
    this.currentPage.set(page);
    this.cdr.markForCheck();

    this.notificationApiService.getNotifications(page, this.pageSize).subscribe({
      next: (notificationPage: NotificationPage) => {
        this.notifications.set(notificationPage.content);
        this.totalPages.set(notificationPage.totalPages);
        this.totalElements.set(notificationPage.totalElements);
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

  markAsRead(notification: Notification): void {
    if (notification.isRead) {
      return;
    }

    this.notificationApiService.markAsRead(notification.notificationId).subscribe({
      next: () => {
        // Update local state
        const updated = {...notification, isRead: true};
        const current = this.notifications();
        const index = current.findIndex(n => n.notificationId === notification.notificationId);
        if (index !== -1) {
          current[index] = updated;
          this.notifications.set([...current]);
        }
        
        // Refresh unread count
        this.notificationApiService.refreshUnreadCount();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error marking notification as read:', err);
      }
    });
  }

  markAllAsRead(): void {
    this.notificationApiService.markAllAsRead().subscribe({
      next: () => {
        // Update all notifications to read
        const current = this.notifications();
        const updated = current.map(n => ({...n, isRead: true}));
        this.notifications.set(updated);
        
        // Refresh unread count
        this.notificationApiService.refreshUnreadCount();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error marking all as read:', err);
      }
    });
  }

  navigateToNotification(notification: Notification): void {
    // Mark as read first
    if (!notification.isRead) {
      this.markAsRead(notification);
    }

    // Navigate based on notification type
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
        // Stay on notifications page
        break;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
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

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.loadNotifications(page);
    }
  }

  previousPage(): void {
    const current = this.currentPage();
    if (current > 0) {
      this.goToPage(current - 1);
    }
  }

  nextPage(): void {
    const current = this.currentPage();
    if (current < this.totalPages() - 1) {
      this.goToPage(current + 1);
    }
  }
}

