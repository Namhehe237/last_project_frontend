import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, viewChild, signal } from '@angular/core';
import { TableComponent, ColumnInterface, TableRowData } from '#common/components/table/table.component';
import { ExamService } from '#common/services/exam.service';
import { NotificationService } from '#common/services/notification.service';
import { TestHistoryResponse } from '#common/models/TestHistoryResponse';
import { ExamResultDetailDialogComponent } from './exam-result-detail-dialog/exam-result-detail-dialog';

interface TestHistoryRow extends TableRowData {
  examId: number;
  examName: string;
  subjectName: string;
  score: number | null;
  totalQuestions: number;
  correctAnswers: number;
  submitTime: string | null;
  videoUrl: string | null;
  status?: string;
  scoreDisplay: string;
  scoreDetail: string;
  videoLink: string;
  videoLinkHref?: () => void;
  examNameHref?: () => void;
}

@Component({
  selector: 'app-test-history',
  imports: [TableComponent, ExamResultDetailDialogComponent],
  templateUrl: './test-history.html',
  styleUrl: './test-history.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestHistory implements OnInit {
  readonly #examService = inject(ExamService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);

  readonly dataTable = viewChild<TableComponent>('dataTable');
  readonly resultDetailDialog = viewChild<ExamResultDetailDialogComponent>('resultDetailDialog');

  isLoading = false;
  totalElements = 0;
  readonly selectedExamId = signal<number | null>(null);

  testHistory: TestHistoryRow[] = [];
  
  columns: ColumnInterface[] = [
    { title: 'EXAM NAME', field: 'examName', isStickyFirst: true, isHref: true },
    { title: 'SUBJECT', field: 'subjectName' },
    { title: 'SCORE', field: 'scoreDisplay' },
    { title: 'CORRECT/TOTAL', field: 'scoreDetail' },
    { title: 'SUBMIT TIME', field: 'submitTime' },
    { title: 'STATUS', field: 'status' },
    { title: 'VIDEO', field: 'videoLink', isStickyEnd: true, isHref: true },
  ];

  ngOnInit(): void {
    this.loadTestHistory();
  }

  loadTestHistory(): void {
    this.isLoading = true;
    this.#cdr.markForCheck();

    this.#examService.getTestHistory().subscribe({
      next: (data) => {
        this.testHistory = (data ?? []).map((item: TestHistoryResponse): TestHistoryRow => ({
          examId: item.examId,
          examName: item.examName,
          subjectName: item.subjectName,
          score: item.score,
          totalQuestions: item.totalQuestions,
          correctAnswers: item.correctAnswers,
          submitTime: item.submitTime ? new Date(item.submitTime).toLocaleString('vi-VN') : 'N/A',
          videoUrl: item.videoUrl,
          status: item.status ?? undefined, // Convert null to undefined for TableRowData compatibility
          scoreDisplay: item.score != null ? `${item.score.toFixed(2)}/10` : 'N/A',
          scoreDetail: `${item.correctAnswers}/${item.totalQuestions}`,
          videoLink: item.videoUrl ? 'Xem video' : 'Không có',
          videoLinkHref: item.videoUrl ? () => {
            if (item.videoUrl) {
              window.open(item.videoUrl, '_blank');
            }
          } : undefined,
          examNameHref: () => {
            this.selectedExamId.set(item.examId);
            setTimeout(() => {
              this.resultDetailDialog()?.open();
            }, 0);
          },
        }));
        this.totalElements = this.testHistory.length;
        this.isLoading = false;
        this.#cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading test history:', error);
        this.#notificationService.show('Không thể tải lịch sử bài làm', 'error');
        this.testHistory = [];
        this.totalElements = 0;
        this.isLoading = false;
        this.#cdr.markForCheck();
      }
    });
  }

  reloadData(): void {
    this.loadTestHistory();
  }

}
