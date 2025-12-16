import {Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import { NotificationService, NotificationData } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationComponent implements OnInit {
  show = false;
  message = '';
  type: 'success' | 'error' | 'info' = 'success';
  duration = 3000;
  private timeoutId: ReturnType<typeof setTimeout> | undefined;
  private notificationService = inject(NotificationService);
	private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.notificationService.notification$.subscribe((data: NotificationData | null) => {
      if (data) {
        this.message = data.message;
        this.type = data.type;
        this.duration = data.duration ?? 3000;
        this.show = true;
				this.cdr.markForCheck();
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => {
          this.show = false;
					this.cdr.markForCheck();
        }, this.duration);
      } else {
        this.show = false;
				this.cdr.markForCheck();
      }
    });
  }
}
