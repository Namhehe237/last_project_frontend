import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItemInterface } from '../main.interface';
import { AuthService } from '#common/services/auth.service';

@Component({
  selector: 'app-menu-item-2',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-item-2.component.html',
  styleUrl: './menu-item-2.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuItem2Component {
	readonly label = input.required<string>();
	readonly detailName = input.required<string>();
	readonly menuList = input.required<MenuItemInterface[]>();

	readonly #authSvc = inject(AuthService);

	protected isMenuItemVisible(item: MenuItemInterface): boolean {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
		return this.#authSvc.getAuthoritiesCheck(item.authorities);
	}
}
