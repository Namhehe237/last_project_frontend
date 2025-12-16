import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ClassService } from '#common/services/class.service';
import { NotificationService } from '#common/services/notification.service';
import { AuthService } from '#common/services/auth.service';

@Component({
  selector: 'app-create-class',
  imports: [ReactiveFormsModule],
  templateUrl: './create-class.html',
  styleUrl: './create-class.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateClass {
  readonly #classService = inject(ClassService);
  readonly #notificationService = inject(NotificationService);
  readonly #auth = inject(AuthService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly #router = inject(Router);

  readonly form = new FormGroup({
    className: new FormControl<string>('', {
      nonNullable: true,
      validators: [c => Validators.required(c)]
    }),
    description: new FormControl<string>('', { nonNullable: true })
  });

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
    });

    this.form.statusChanges.subscribe(() => {
      this.#cdr.markForCheck();
    });
  }

  isSubmitDisabled(): boolean {
    return this.status() === 1 || this.form.invalid;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.#cdr.markForCheck();
      return;
    }

    const teacherId = this.#auth.userId;
    if (!teacherId) {
      this.#notificationService.show('Bạn chưa được xác thực', 'error');
      return;
    }

    this.status.set(1);

    this.#classService.createClass(
      this.form.controls.className.value,
      teacherId,
      this.form.controls.description.value || undefined
    ).subscribe({
      next: (response) => {
        this.status.set(0);
        this.form.reset();
        this.#notificationService.show('Tạo lớp học thành công!', 'success');
        void this.#router.navigate(['/main/class-detail', response.classId]);
      },
      error: () => {
        this.status.set(0);
        this.#notificationService.show('Tạo lớp học thất bại', 'error');
        this.#cdr.markForCheck();
      }
    });
  }

  onReset(): void {
    this.form.reset();
  }
}
