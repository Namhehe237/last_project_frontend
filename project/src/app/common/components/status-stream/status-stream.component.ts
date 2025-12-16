import {ChangeDetectionStrategy, Component, input} from '@angular/core';
export interface StatusInterface {
  code: string;
  date?: string;
}

@Component({
  selector: 'app-status-stream',
  imports: [],
  templateUrl: './status-stream.component.html',
  styleUrl: './status-stream.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusStreamComponent {
  readonly statuses = input.required<StatusInterface[]>();
}
