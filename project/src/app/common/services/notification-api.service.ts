import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, BehaviorSubject, interval, Subscription} from 'rxjs';
import {switchMap, startWith} from 'rxjs/operators';
import {Notification, NotificationPage, UnreadCountResponse} from '../models/Notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationApiService {
  readonly #http = inject(HttpClient);
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  private pollingSubscription?: Subscription;
  private readonly POLLING_INTERVAL = 30000; // 30 seconds

  startPolling(): void {
    if (this.pollingSubscription) {
      return; // Already polling
    }
    
    this.pollingSubscription = interval(this.POLLING_INTERVAL)
      .pipe(
        startWith(0), // Start immediately
        switchMap(() => this.getUnreadCount())
      )
      .subscribe({
        next: (response) => {
          this.unreadCountSubject.next(response.unreadCount);
        },
        error: (err) => {
          console.error('Error polling unread count:', err);
        }
      });
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  getNotifications(page = 0, size = 20): Observable<NotificationPage> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.#http.get<NotificationPage>('notifications', { params });
  }

  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.#http.get<UnreadCountResponse>('notifications/unread-count');
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.#http.put<void>(`notifications/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.#http.put<void>('notifications/read-all', {});
  }

  getNotification(notificationId: number): Observable<Notification> {
    return this.#http.get<Notification>(`notifications/${notificationId}`);
  }

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCountSubject.next(response.unreadCount);
      },
      error: (err) => {
        console.error('Error refreshing unread count:', err);
      }
    });
  }
}

