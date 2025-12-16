import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamService } from '#common/services/exam.service';
import { NotificationService } from '#common/services/notification.service';
import { ExamResultDetailResponse } from '#common/models/ExamResultDetailResponse';

@Component({
  selector: 'app-exam-result-detail-dialog',
  imports: [CommonModule],
  templateUrl: './exam-result-detail-dialog.html',
  styleUrl: './exam-result-detail-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamResultDetailDialogComponent {
  readonly #examService = inject(ExamService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);

  readonly examId = input.required<number>();
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_exam_result_detail_dialog');

  readonly result = signal<ExamResultDetailResponse | null>(null);
  readonly isLoading = signal<boolean>(false);

  open(): void {
    this.dialog().nativeElement.showModal();
    this.loadResult();
  }

  onClose(): void {
    this.closed.emit();
    this.dialog().nativeElement.close();
  }

  loadResult(): void {
    this.isLoading.set(true);
    this.#examService.getExamResultDetail(this.examId()).subscribe({
      next: (data) => {
        this.result.set(data);
        this.isLoading.set(false);
        this.#cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading exam result detail:', error);
        this.#notificationService.show('Không thể tải chi tiết bài thi', 'error');
        this.isLoading.set(false);
        this.#cdr.markForCheck();
      }
    });
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN');
    } catch {
      return '';
    }
  }

  formatScore(score: number | null | undefined): string {
    if (score === null || score === undefined) {
      return 'N/A';
    }
    return `${score.toFixed(2)}/10`;
  }
}

