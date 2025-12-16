import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssignmentSubmissionService } from '#common/services/assignment-submission.service';
import { NotificationService } from '#common/services/notification.service';

type SubmissionType = 'LINK' | 'FILE';

@Component({
  selector: 'app-assignment-submit-dialog',
  imports: [FormsModule],
  templateUrl: './assignment-submit-dialog.html',
  styleUrl: './assignment-submit-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignmentSubmitDialogComponent {
  readonly #submissionService = inject(AssignmentSubmissionService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);

  readonly assignmentId = input.required<number>();
  readonly submissionId = input<number | null>(null); // For update mode
  readonly submitted = output<void>();
  readonly closed = output<void>();

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('_submit_dialog');

  submissionType: SubmissionType = 'LINK';
  linkUrl = '';
  selectedFile: File | null = null;

  protected readonly status = signal<0 | 1>(0);
  readonly isLoading = signal<boolean>(false);
  readonly canSubmit = signal<boolean>(false);

  constructor() {
    this.checkCanSubmit();
  }

  open(): void {
    this.dialog()?.nativeElement.showModal();
    if (this.submissionId()) {
      this.loadExistingSubmission();
    } else {
      this.checkCanSubmit();
    }
  }

  loadExistingSubmission(): void {
    this.isLoading.set(true);
    this.#submissionService.getStudentSubmission(this.assignmentId()).subscribe({
      next: (submission) => {
        if (submission) {
          this.submissionType = submission.submissionType;
          if (submission.submissionType === 'LINK') {
            this.linkUrl = submission.linkUrl ?? '';
          }
        }
        this.isLoading.set(false);
        this.checkCanSubmit();
        this.#cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading submission:', error);
        this.isLoading.set(false);
        this.checkCanSubmit();
        this.#cdr.markForCheck();
      }
    });
  }

  private checkCanSubmit(): void {
    if (this.submissionType === 'LINK') {
      const isValidUrl = this.linkUrl.trim() !== '' && this.isValidUrl(this.linkUrl);
      this.canSubmit.set(isValidUrl);
    } else {
      this.canSubmit.set(this.selectedFile !== null);
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  onClose(): void {
    this.closed.emit();
    this.dialog()?.nativeElement.close();
    if (!this.submissionId()) {
      this.resetForm();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file) {
        this.selectedFile = null;
        this.checkCanSubmit();
        this.#cdr.markForCheck();
        return;
      }
      
      const validExtensions = ['.docx', '.doc', '.xlsx', '.xls', '.pdf', '.pptx', '.ppt'];
      const fileName = file.name?.toLowerCase() || '';
      const isValidType = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!isValidType) {
        this.#notificationService.show('Chỉ chấp nhận file DOCX, XLSX, PDF, PPT', 'error');
        input.value = '';
        this.selectedFile = null;
        this.checkCanSubmit();
        this.#cdr.markForCheck();
        return;
      }

      const maxSize = 100 * 1024 * 1024;
      if (file.size && file.size > maxSize) {
        this.#notificationService.show('Kích thước file không được vượt quá 100MB', 'error');
        input.value = '';
        this.selectedFile = null;
        this.checkCanSubmit();
        this.#cdr.markForCheck();
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

  onSubmissionTypeChange(): void {
    this.checkCanSubmit();
    this.#cdr.markForCheck();
  }

  onLinkUrlChange(): void {
    this.checkCanSubmit();
    this.#cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.submissionType === 'LINK') {
      if (!this.linkUrl.trim()) {
        this.#notificationService.show('Vui lòng nhập link', 'error');
        return;
      }
      try {
        new URL(this.linkUrl);
      } catch {
        this.#notificationService.show('Link không hợp lệ', 'error');
        return;
      }
    } else {
      if (!this.selectedFile) {
        this.#notificationService.show('Vui lòng chọn file', 'error');
        return;
      }
    }

    this.status.set(1);
    this.#cdr.markForCheck();

    const submissionData = {
      submissionType: this.submissionType,
      linkUrl: this.submissionType === 'LINK' ? this.linkUrl : undefined,
      file: this.submissionType === 'FILE' ? (this.selectedFile ?? undefined) : undefined
    };

    const submissionId = this.submissionId();
    const submitObservable = submissionId 
      ? this.#submissionService.updateSubmission(submissionId, submissionData)
      : this.#submissionService.submitAssignment(this.assignmentId(), submissionData);

    submitObservable.subscribe({
      next: () => {
        this.#notificationService.show(submissionId ? 'Cập nhật bài nộp thành công!' : 'Nộp bài thành công!', 'success');
        this.status.set(0);
        this.submitted.emit();
        this.resetForm();
        this.onClose();
      },
      error: (error: unknown) => {
        console.error('Error submitting assignment:', error);
        const errorObj = error as { error?: string; message?: string };
        const errorMessage = errorObj?.error ?? errorObj?.message ?? 'Unknown error';
        this.#notificationService.show(`Không thể ${submissionId ? 'cập nhật' : 'nộp'} bài: ${errorMessage}`, 'error');
        this.status.set(0);
        this.#cdr.markForCheck();
      }
    });
  }

  resetForm(): void {
    this.submissionType = 'LINK';
    this.linkUrl = '';
    this.selectedFile = null;
    this.checkCanSubmit();
    this.#cdr.markForCheck();
  }
}

