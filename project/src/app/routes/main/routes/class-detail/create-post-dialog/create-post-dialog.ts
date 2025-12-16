import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentRef, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { PostService } from '#common/services/post.service';
import { NotificationService } from '#common/services/notification.service';

export type PostType = 'ANNOUNCEMENT' | 'ASSIGNMENT';

@Component({
  selector: 'app-create-post-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './create-post-dialog.html',
  styleUrl: './create-post-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePostDialog {
  readonly #postService = inject(PostService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);

  readonly compRef = input.required<ComponentRef<CreatePostDialog>>();
  readonly classId = input.required<number>();

  readonly closed = output<string | undefined>();
  readonly createPostResult = output<boolean>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_create_post');

  readonly postTypes: PostType[] = ['ANNOUNCEMENT', 'ASSIGNMENT'];

  readonly form = new FormGroup({
    postType: new FormControl<PostType>('ANNOUNCEMENT', {
      nonNullable: true,
      validators: [c => Validators.required(c)]
    }),
    title: new FormControl<string>('', {
      nonNullable: true,
      validators: [c => Validators.required(c)]
    }),
    content: new FormControl<string>('', {
      nonNullable: true,
      validators: [c => Validators.required(c)]
    }),
    dueDate: new FormControl<string | null>(null, {
      nonNullable: false,
      validators: []
    }),
    totalPoints: new FormControl<number | null>(null, {
      nonNullable: false
    })
  });

  selectedFile: File | null = null;

  protected readonly status = signal<0 | 1>(0);
  readonly canSubmit = signal<boolean>(false);

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

    this.form.get('postType')?.valueChanges.subscribe(() => {
      const isAssignment = this.form.get('postType')?.value === 'ASSIGNMENT';
      const dueDateControl = this.form.get('dueDate');
      
      if (isAssignment) {
        dueDateControl?.setValidators([
          c => Validators.required(c),
          this.futureDateValidator
        ]);
      } else {
        dueDateControl?.clearValidators();
        dueDateControl?.setValue(null);
      }
      
      dueDateControl?.updateValueAndValidity();
      this.checkCanSubmit();
      this.#cdr.markForCheck();
    });

    this.form.valueChanges.subscribe(() => {
      this.checkCanSubmit();
    });

    this.form.statusChanges.subscribe(() => {
      this.checkCanSubmit();
    });

    this.checkCanSubmit();
  }

  private futureDateValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = String(control.value);
    const selectedDate = new Date(value);
    const now = new Date();

    if (isNaN(selectedDate.getTime()) || selectedDate <= now) {
      return { futureDate: true };
    }

    return null;
  };

  private checkCanSubmit(): void {
    const formValue = this.form.value;
    const isAssignment = formValue.postType === 'ASSIGNMENT';
    
    const postTypeControl = this.form.get('postType');
    const titleControl = this.form.get('title');
    const contentControl = this.form.get('content');
    
    if (!postTypeControl?.valid || !titleControl?.valid || !contentControl?.valid) {
      this.canSubmit.set(false);
      return;
    }

    if (isAssignment) {
      const dueDateControl = this.form.get('dueDate');
      const hasDueDate = !!formValue.dueDate && (dueDateControl?.valid ?? false);
      this.canSubmit.set(hasDueDate);
      return;
    }

    this.canSubmit.set(true);
  }

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  onClose(): void {
    this.compRef().destroy();
  }

  onOkCancel(): void {
    this.closed.emit(undefined);
    this.dialog().nativeElement.close();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file) return;
      
      const validExtensions = ['.docx', '.doc', '.xlsx', '.xls', '.pdf', '.pptx', '.ppt'];
      const fileName = file.name?.toLowerCase() || '';
      const isValidType = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!isValidType) {
        this.#notificationService.show('Chỉ chấp nhận file DOCX, XLSX, PDF, PPT', 'error');
        input.value = '';
        return;
      }

      const maxSize = 100 * 1024 * 1024;
      if (file.size && file.size > maxSize) {
        this.#notificationService.show('Kích thước file không được vượt quá 100MB', 'error');
        input.value = '';
        return;
      }

      this.selectedFile = file;
      this.checkCanSubmit();
      this.#cdr.markForCheck();
    } else {
      this.selectedFile = null;
      this.checkCanSubmit();
      this.#cdr.markForCheck();
    }
  }

  onSubmit(): void {
    if (!this.canSubmit() || this.status() === 1) {
      this.form.markAllAsTouched();
      const formValue = this.form.value;
      const isAssignment = formValue.postType === 'ASSIGNMENT';
      
      if (isAssignment) {
        if (!formValue.dueDate) {
          this.#notificationService.show('Vui lòng nhập ngày hết hạn cho bài tập', 'error');
        } else if (this.form.get('dueDate')?.hasError('futureDate')) {
          this.#notificationService.show('Ngày hết hạn phải lớn hơn thời gian hiện tại', 'error');
        } else if (!this.selectedFile) {
          this.#notificationService.show('Vui lòng chọn file đính kèm cho bài tập', 'error');
        }
      }
      return;
    }

    const formValue = this.form.value;

    this.status.set(1);
    this.#cdr.markForCheck();

    const postData = {
      title: formValue.title!,
      content: formValue.content!,
      postType: formValue.postType!,
      dueDate: formValue.dueDate ?? undefined,
      totalPoints: formValue.totalPoints ?? undefined,
      attachmentFile: this.selectedFile ?? undefined
    };

    this.#postService.createPost(this.classId(), postData).subscribe({
      next: () => {
        this.#notificationService.show('Đăng bài thành công!', 'success');
        this.createPostResult.emit(true);
        this.resetForm();
        this.onOkCancel();
      },
      error: (error: unknown) => {
        console.error('Error creating post:', error);
        const errorObj = error as { error?: string; message?: string };
        const errorMessage = errorObj?.error ?? errorObj?.message ?? 'Unknown error';
        this.#notificationService.show(`Không thể đăng bài: ${errorMessage}`, 'error');
        this.status.set(0);
        this.#cdr.markForCheck();
      }
    });
  }

  resetForm(): void {
    this.form.reset({
      postType: 'ANNOUNCEMENT',
      title: '',
      content: '',
      dueDate: null,
      totalPoints: null
    });
    this.selectedFile = null;
    this.#cdr.markForCheck();
  }

  get isAssignment(): boolean {
    return this.form.get('postType')?.value === 'ASSIGNMENT';
  }
}

