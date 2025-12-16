import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-menu-item-1',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-item-1.component.html',
  styleUrl: './menu-item-1.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuItem1Component {
	readonly label = input.required<string>();
	readonly link = input.required<string>();
}
