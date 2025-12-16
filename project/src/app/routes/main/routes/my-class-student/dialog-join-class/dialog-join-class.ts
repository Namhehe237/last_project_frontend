import { ChangeDetectionStrategy, Component, ComponentRef, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StudentService } from '#common/services/student.service';
import { AuthService } from '#common/services/auth.service';
import { NotificationService } from '#common/services/notification.service';

@Component({
  selector: 'app-dialog-join-class',
  imports: [ReactiveFormsModule],
  templateUrl: './dialog-join-class.html',
  styleUrl: './dialog-join-class.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogJoinClass {
  readonly #studentService = inject(StudentService);
  readonly #authService = inject(AuthService);
  readonly #notificationService = inject(NotificationService);
  readonly compRef = input.required<ComponentRef<DialogJoinClass>>();

  readonly closed = output<string | undefined>();
  readonly joinClassResult = output<boolean>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_join_class');

  readonly form = new FormGroup({
    classCode: new FormControl<string>('', {
      nonNullable: true,
      validators: [c => Validators.required(c)]
    })
  });

  // 0 : normal
  // 1 : saving...
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
    this.status.set(1);

    const studentId = this.#authService.userId;
    if (!studentId) {
      this.#notificationService.show('User not authenticated!', 'error');
      this.status.set(0);
      return;
    }

    this.#studentService.requestJoinClass(studentId, this.form.controls.classCode.value).subscribe({
      next: () => {
        this.joinClassResult.emit(true);
        this.status.set(0);
        this.#notificationService.show('Join class request sent successfully!', 'success');
        this.onOkCancel();
      },
      error: () => {
        this.joinClassResult.emit(false);
        this.status.set(0);
        this.#notificationService.show('Failed to send join class request', 'error');
        this.onOkCancel();
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
