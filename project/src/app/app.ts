import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from '#common/components/notification/notification.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'front';
}
