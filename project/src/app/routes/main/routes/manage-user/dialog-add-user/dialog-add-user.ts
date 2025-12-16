import { ChangeDetectionStrategy, Component, ComponentRef, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Role } from '#common/services/auth.service';
import { AdminService } from '#common/services/admin.service';
import { MessageService } from '#common/services/message.service';

@Component({
  selector: 'app-dialog-add-user',
  imports: [ReactiveFormsModule],
  templateUrl: './dialog-add-user.html',
  styleUrl: './dialog-add-user.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogAddUser {
  readonly #adminService = inject(AdminService);
  readonly #message = inject(MessageService);
  readonly compRef = input.required<ComponentRef<DialogAddUser>>();

	readonly closed = output<string | undefined>();
  readonly addUserResult = output<boolean>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_add_user');

  readonly roles: Role[] = ['STUDENT' , 'TEACHER' , 'ADMIN'];

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
      nonNullable: true,
      validators: [c => Validators.required(c)]
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

	protected readonly status = signal<0 | 1>(0);
	

	constructor() {
		effect(() => {
			switch(this.status()) {
				case 0: {
					this.form.enable();
					break;
				}
				case 1: {
					this.form.disable();
					break;
				}
			}
		})
	}

  open(): void {
		this.dialog().nativeElement.showModal();
	}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.status.set(1);

    this.#adminService.addUser(
      this.form.controls.email.value,
      this.form.controls.password.value,
      this.form.controls.role.value,
      this.form.controls.fullName.value,
      this.form.controls.phoneNumber.value
    ).subscribe({
      next: () => {
        this.addUserResult.emit(true);
        this.status.set(0);
        this.onOkCancel();
      },
      error: (err: HttpErrorResponse) => {
        this.addUserResult.emit(false);
        this.status.set(0);
        this.#message.error(err, () => {
					this.onOkCancel();
				})
      }
    });
  }

  protected onClose() {
		this.compRef().destroy();
	}


	protected onOkCancel(val?: string) {
		this.closed.emit(val);
		this.dialog().nativeElement.close(val);
	}
}
