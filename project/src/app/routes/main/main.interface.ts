import { AuthoritiesCheck } from "#common/services/auth.service";

export interface MenuItemInterface {
	link: string;
	label: string;
	
	authorities: AuthoritiesCheck;
}
