import { Component, input, output, ChangeDetectionStrategy, inject, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ClassService } from '#common/services/class.service';
import { NotificationService } from '#common/services/notification.service';
import { ChangeDetectorRef } from '@angular/core';
import { ListClassContent } from '#common/models/ListClassResponse';

@Component({
  selector: 'app-update-class-drawer',
  imports: [ReactiveFormsModule],
  templateUrl: './update-class-drawer.html',
  styleUrl: './update-class-drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateClassDrawerComponent implements OnChanges {
  readonly classData = input<ListClassContent | null>(null);
  
  updateClassResult = output<boolean>();
  closeDrawer = output<void>();

  readonly #classService = inject(ClassService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly #fb = inject(FormBuilder);

  updateForm: FormGroup;
  isLoading = false;
  private originalValues: { className: string; classCode: string; description: string } | null = null;

  constructor() {
    this.updateForm = this.#fb.group({
      className: ['', [(c: AbstractControl) => Validators.required(c), (c: AbstractControl) => Validators.minLength(1)(c)]],
      classCode: ['', [(c: AbstractControl) => Validators.required(c), (c: AbstractControl) => Validators.minLength(1)(c)]],
      description: ['']
    });

    this.updateForm.valueChanges.subscribe(() => {
      this.#cdr.markForCheck();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['classData'] && this.classData()) {
      const data = this.classData();
      if (!data) return;
      
      const originalValues = {
        className: data.className ?? '',
        classCode: data.classCode ?? '',
        description: data.description ?? ''
      };
      
      this.originalValues = originalValues;
      
      this.updateForm.patchValue(originalValues);
      this.#cdr.markForCheck();
    }
  }

  hasFormChanged(): boolean {
    if (!this.originalValues) {
      return false;
    }

    const currentValues = this.updateForm.value as { className: string; classCode: string; description: string };
    return (
      currentValues.className !== this.originalValues.className ||
      currentValues.classCode !== this.originalValues.classCode ||
      (currentValues.description ?? '') !== (this.originalValues.description ?? '')
    );
  }

  isUpdateDisabled(): boolean {
    return this.isLoading || this.updateForm.invalid || !this.hasFormChanged();
  }

  onUpdateClass() {
    this.updateForm.markAllAsTouched();
    
    if (this.updateForm.invalid) {
      this.#cdr.markForCheck();
      return;
    }

    const data = this.classData();
    if (!this.hasFormChanged() || !data?.classId) {
      return;
    }

    this.isLoading = true;
    const formValue = this.updateForm.value as { className: string; classCode: string; description: string };
    
    this.#classService.updateClassDetail(
      data.classId,
      formValue.className,
      formValue.classCode,
      formValue.description
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.#notificationService.show('Cập nhật lớp học thành công!', 'success');
        this.updateClassResult.emit(true);
        this.closeDrawer.emit();
      },
      error: () => {
        this.isLoading = false;
        this.#notificationService.show('Cập nhật lớp học thất bại', 'error');
        this.#cdr.markForCheck();
      }
    });
  }

  onClose() {
    this.closeDrawer.emit();
  }
}
