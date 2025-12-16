import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TableComponent, ColumnInterface, TableRowData } from '#common/components/table/table.component';
import { ExamService } from '#common/services/exam.service';
import { NotificationService } from '#common/services/notification.service';
import { AuthService } from '#common/services/auth.service';
import { ExamDetailResponse } from '#common/models/ExamDetailResponse';

@Component({
  selector: 'app-my-test',
  imports: [TableComponent],
  templateUrl: './my-test.html',
  styleUrl: './my-test.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyTest implements OnInit {
  readonly #examService = inject(ExamService);
  readonly #notificationService = inject(NotificationService);
  readonly #auth = inject(AuthService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly router = inject(Router);

  readonly dataTable = viewChild<TableComponent>('dataTable');

  isLoading = false;
  totalElements = 0;

  exams: ExamRow[] = [];
  columns: ColumnInterface[] = [
    { title: 'TÊN BÀI THI', field: 'examName', isStickyFirst: true },
    { title: 'MÔN HỌC', field: 'subjectName' },
    { title: 'THỜI GIAN (phút)', field: 'durationMinutes' },
    { title: 'TÊN LỚP', field: 'className' },
    { title: 'GIÁO VIÊN', field: 'teacherName' },
    { title: 'NGÀY TẠO', field: 'createdAt', isFormattedDate: true },
    { title: 'HÀNH ĐỘNG', field: 'action', isStickyEnd: true, isAction: true, width: 200 },
  ];

  ngOnInit(): void {
    this.search(true);
  }

  search(isSearch: boolean): void {
    const currentUserId = this.#auth.userId;
    if (!currentUserId) {
      this.#notificationService.show('Bạn chưa được xác thực', 'error');
      return;
    }

    if (isSearch) {
      const table = this.dataTable();
      if (table) table.page = 1;
    }

    this.isLoading = true;
    const pageNumber = this.dataTable()?.page ?? 1;
    const pageSize = this.dataTable()?.pageSize ?? 20;

    this.#examService.getExamList(pageNumber - 1, pageSize, currentUserId, undefined).subscribe({
      next: (res) => {
        const content: readonly ExamDetailResponse[] = res.content ?? [];
        this.exams = content.map((e): ExamRow => ({
          ...e,
        }));
        this.totalElements = res.totalElements ?? 0;
        this.isLoading = false;
        this.#cdr.markForCheck();
      },
      error: () => {
        this.exams = [];
        this.totalElements = 0;
        this.isLoading = false;
        this.#cdr.markForCheck();
      }
    });
  }

  reloadData(): void {
    this.search(false);
  }

  onActionClick(event: { action: string; data: TableRowData }): void {
    const { action } = event;
    if (action === 'do-test') {
      const data = event.data as Partial<ExamDetailResponse>;
      const examId = data.examId;
      if (examId != null) {
        void this.router.navigate(['/main/do-test', examId]);
      }
    }
  }
}

interface ExamRow extends ExamDetailResponse, TableRowData {
}
