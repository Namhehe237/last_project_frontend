import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterDto, Role } from '#common/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '#common/services/notification.service';

type AnyRecord = Record<string, unknown>;
const isRecord = (v: unknown): v is AnyRecord => typeof v === 'object' && v !== null;

function extractHttpMessage(err: unknown, fallback = 'Đăng ký thất bại'): string {
  if (err instanceof HttpErrorResponse) {
    if (typeof err.error === 'string') return err.error;
    if (isRecord(err.error) && typeof (err.error as { message?: unknown }).message === 'string') {
      return (err.error as { message: string }).message;
    }
    return err.message ?? fallback;
  }
  if (err instanceof Error) return err.message ?? fallback;
  return fallback;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly state = signal<0 | 1>(0);

  readonly form = new FormGroup({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [c => Validators.required(c), c => Validators.email(c)]
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [c => Validators.required(c), c => Validators.minLength(6)(c)]
    }),
    fullName: new FormControl<string>('', {
      nonNullable: true,
      validators: [c => Validators.required(c)]
    }),
    phoneNumber: new FormControl<string>('', {
      nonNullable: true,
      validators: [c => this.phoneNumberValidator(c)]
    }),
    role: new FormControl<Role>('STUDENT', {
      nonNullable: true
    })
  });

  private phoneNumberValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const phoneRegex = /^\d{10}$/;
    const value = String(control.value);
    if (!phoneRegex.test(value)) {
      return { phoneNumber: true };
    }
    return null;
  }

  readonly onSubmit = async (): Promise<void> => {
    if (this.form.invalid || this.state() === 1) return;
    this.state.set(1);

    const body: RegisterDto = this.form.getRawValue() as RegisterDto;

    try {
      await firstValueFrom(this.auth.register(body));
      this.notification.show('Đăng ký tài khoản thành công!', 'success');
      this.auth.clearAuthInfo();
      await this.router.navigateByUrl('/login');
    } catch (err: unknown) {
      alert(extractHttpMessage(err));
    } finally {
      this.state.set(0);
    }
  };
}
