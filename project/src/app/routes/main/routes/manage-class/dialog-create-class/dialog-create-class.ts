import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentRef, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClassService } from '#common/services/class.service';
import { NotificationService } from '#common/services/notification.service';
import { TeacherAutocompleteSelectComponent } from '#common/components/teacher-autocomplete-select/teacher-autocomplete-select.component';

@Component({
  selector: 'app-dialog-create-class',
  imports: [ReactiveFormsModule, TeacherAutocompleteSelectComponent],
  templateUrl: './dialog-create-class.html',
  styleUrl: './dialog-create-class.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogCreateClass {
  readonly #classService = inject(ClassService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly compRef = input.required<ComponentRef<DialogCreateClass>>();

  readonly closed = output<string | undefined>();
  readonly createClassResult = output<boolean>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_create_class');

  readonly form = new FormGroup({
    className: new FormControl<string>('', {
      nonNullable: true,
      validators: [c => Validators.required(c)]
    }),
    teacherId: new FormControl<number | null>(null, {
      nonNullable: false,
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

  onTeacherSelected(teacherId: number | undefined): void {
    if (teacherId !== undefined) {
      this.form.controls.teacherId.setValue(teacherId);
    } else {
      this.form.controls.teacherId.setValue(null);
    }
  }

  isSubmitDisabled(): boolean {
    return this.status() === 1 || this.form.invalid;
  }

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.#cdr.markForCheck();
      return;
    }

    this.status.set(1);

    const teacherId = this.form.controls.teacherId.value!;

    this.#classService.createClass(
      this.form.controls.className.value,
      teacherId,
      this.form.controls.description.value || undefined
    ).subscribe({
      next: () => {
        this.createClassResult.emit(true);
        this.status.set(0);
        this.#notificationService.show('Tạo lớp học thành công!', 'success');
        this.onOkCancel();
      },
      error: () => {
        this.createClassResult.emit(false);
        this.status.set(0);
        this.#notificationService.show('Tạo lớp học thất bại', 'error');
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
