import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
	readonly #auth = inject(AuthService);
	readonly #router = inject(Router);

	
	error(err: HttpErrorResponse, callback?: () => void , message?: string) {
		if(err.status === 401) {
			alert('[ Failed to log in ]\n\nPlease check your account information and make sure you have sufficient permissions.');

			this.#auth.clearAuthInfo();

			void this.#router.navigateByUrl('/login', {onSameUrlNavigation: 'reload'});
		} else {
			alert(message ?? `[ Error : ${err.status} ] ${err.error}\n\n${err.message}`);
		}

		if(callback !== undefined) {
			callback();
		}
	}
}
