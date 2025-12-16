import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent, ColumnInterface, TableRowData } from '#common/components/table/table.component';
import { ViolationLogService } from '#common/services/violation-log.service';
import { NotificationService } from '#common/services/notification.service';
import { AuthService } from '#common/services/auth.service';
import { TeacherExam } from '#common/models/TeacherExam';
import { DialogService } from '#common/services/dialog.service';

interface ExamRow extends TeacherExam, TableRowData {
}
@Component({
  selector: 'app-exam-management',
  imports: [CommonModule, TableComponent],
  templateUrl: './exam-management.html',
  styleUrl: './exam-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamManagement implements OnInit {
  readonly #violationLogService = inject(ViolationLogService);
  readonly #notificationService = inject(NotificationService);
  readonly #auth = inject(AuthService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly #dialogService = inject(DialogService);

  readonly dataTable = viewChild<TableComponent>('dataTable');

  isLoading = false;
  totalElements = 0;

  exams: ExamRow[] = [];
  columns: ColumnInterface[] = [
    { title: 'TÊN BÀI THI', field: 'examName', isStickyFirst: true },
    { title: 'MÔN HỌC', field: 'subjectName' },
    { title: 'TÊN LỚP', field: 'className' },
    { title: 'SỐ HỌC SINH', field: 'studentCount', isCount: true },
    { title: 'SỐ LẦN VI PHẠM', field: 'violationCount', isCount: true },
    { title: 'NGÀY TẠO', field: 'createdAt', isFormattedDate: true },
    { title: 'CHI TIẾT', field: 'action', isStickyEnd: true, isAction: true, width: 200 },
  ];

  ngOnInit(): void {
    this.loadExams();
  }

  loadExams(): void {
    const teacherId = this.#auth.userId;
    if (!teacherId) {
      this.#notificationService.show('Bạn chưa được xác thực', 'error');
      return;
    }

    this.isLoading = true;
    this.#violationLogService.getTeacherExams(teacherId).subscribe({
      next: (exams) => {
        this.exams = exams.map((e): ExamRow => ({
          ...e,
        }));
        this.totalElements = exams.length;
        this.isLoading = false;
        this.#cdr.markForCheck();
      },
      error: () => {
        this.exams = [];
        this.totalElements = 0;
        this.isLoading = false;
        this.#notificationService.show('Không thể tải danh sách bài thi', 'error');
        this.#cdr.markForCheck();
      }
    });
  }

  reloadData(): void {
    this.loadExams();
  }

  onActionClick(event: { action: string; data: TableRowData }): void {
    const { action } = event;
    if (action === 'view-students') {
      const data = event.data as Partial<TeacherExam>;
      if (data.examId != null) {
        this.#dialogService.openDialogExamStudents(data as TeacherExam);
      }
    }
  }
}


