import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '#common/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

function extractHttpMessage(err: unknown, fallback = 'Đăng nhập thất bại'): string {
  if (err instanceof HttpErrorResponse) {
    if (typeof err.error === 'string') {
      return err.error;
    }

    if (
      typeof err.error === 'object' &&
      err.error !== null &&
      'message' in err.error &&
      typeof (err.error as { message: unknown }).message === 'string'
    ) {
      return (err.error as { message: string }).message;
    }

    return err.message ?? fallback;
  }

  if (err instanceof Error) {
    return err.message ?? fallback;
  }

  return fallback;
}


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly state = signal<0 | 1>(0);

  readonly form = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        c => Validators.required(c),
        c => Validators.email(c),
      ],
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        c => Validators.required(c),
        c => Validators.minLength(6)(c),
      ],
    }),
  });

  readonly onSubmit = async (): Promise<void> => {
    if (this.form.invalid || this.state() === 1) return;
    this.state.set(1);

    const body: LoginRequest = {
      email: this.form.controls.email.value,
      password: this.form.controls.password.value,
    };

    try {
      await firstValueFrom(this.auth.login(body));
      await this.router.navigateByUrl('/main');
    } catch (e: unknown) {
      alert(extractHttpMessage(e));
    } finally {
      this.state.set(0);
    }
  };
}
