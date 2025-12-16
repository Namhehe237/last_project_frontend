import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentRef, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViolationLogService } from '#common/services/violation-log.service';
import { NotificationService } from '#common/services/notification.service';
import { TeacherExam } from '#common/models/TeacherExam';
import { ExamStudent } from '#common/models/ExamStudent';
import { ViolationLog } from '#common/models/ViolationLog';
import { TableComponent, ColumnInterface, TableRowData } from '#common/components/table/table.component';

@Component({
  selector: 'app-dialog-exam-students',
  imports: [CommonModule, TableComponent],
  templateUrl: './dialog-exam-students.html',
  styleUrl: './dialog-exam-students.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogExamStudents {
  readonly #violationLogService = inject(ViolationLogService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);

  readonly compRef = input.required<ComponentRef<DialogExamStudents>>();
  readonly exam = input.required<TeacherExam>();

  readonly closed = output<string | undefined>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_exam_students');

  students: ExamStudent[] = [];
  violations: ViolationLog[] = [];
  isLoadingStudents = false;
  isLoadingViolations = false;
  selectedStudent: ExamStudent | null = null;

  studentRows: StudentRow[] = [];
  violationRows: ViolationRow[] = [];

  studentColumns: ColumnInterface[] = [
    { title: 'Tên học sinh', field: 'studentName' },
    { title: 'Email', field: 'studentEmail' },
    { title: 'Trạng thái', field: 'status', isColor: true },
    { title: 'Số vi phạm', field: 'violationCount', isCount: true },
    { title: 'Video', field: 'video', isAction: true },
    { title: 'Hành động', field: 'action', isAction: true, width: 150 },
  ];

  violationColumns: ColumnInterface[] = [
    { title: 'Thời gian', field: 'timestamp' },
    { title: 'Loại vi phạm', field: 'violationTypeLabel' },
    { title: 'Mô tả', field: 'message' },
    { title: 'Session ID', field: 'sessionId' },
  ];

  open(): void {
    this.dialog().nativeElement.showModal();
    this.loadStudents();
  }

  protected onClose(): void {
    this.compRef().destroy();
  }

  protected onOkCancel(val?: string): void {
    this.closed.emit(val);
    this.dialog().nativeElement.close(val);
  }

  protected loadStudents(): void {
    this.isLoadingStudents = true;
    this.#violationLogService.getExamStudents(this.exam().examId).subscribe({
      next: (students) => {
        this.students = students;
        this.studentRows = students.map((s): StudentRow => ({
          ...s,
          status: s.hasTakenExam ? 'Đã làm' : 'Chưa làm',
          statusColor: s.hasTakenExam ? '#16a34a' : '#6b7280',
          video: s.videoUrl ? 'Xem video' : '-',
          videoUrl: s.videoUrl ?? null,
        }));
        this.isLoadingStudents = false;
        this.#cdr.markForCheck();
      },
      error: () => {
        this.students = [];
        this.studentRows = [];
        this.isLoadingStudents = false;
        this.#notificationService.show('Không thể tải danh sách học sinh', 'error');
        this.#cdr.markForCheck();
      }
    });
  }

  viewViolations(student: ExamStudent): void {
    if (!student.hasViolations) {
      return;
    }

    this.selectedStudent = student;
    this.isLoadingViolations = true;
    this.#violationLogService.getViolations(this.exam().examId, student.studentId).subscribe({
      next: (violations) => {
        this.violations = violations;
        this.violationRows = violations.map((v): ViolationRow => ({
          ...v,
          violationTypeLabel: this.getViolationTypeLabel(v.violationType),
        }));
        this.isLoadingViolations = false;
        this.#cdr.markForCheck();
      },
      error: () => {
        this.violations = [];
        this.violationRows = [];
        this.isLoadingViolations = false;
        this.#notificationService.show('Không thể tải log vi phạm', 'error');
        this.#cdr.markForCheck();
      }
    });
  }

  onStudentActionClick(event: { action: string; data: TableRowData; field?: string }): void {
    const { action, data, field } = event;
    if (action === 'view-log') {
      const student = this.students.find(s => s.studentId === (data as StudentRow).studentId);
      if (student) {
        this.viewViolations(student);
      }
    } else if (action === 'view-video' || field === 'video') {
      const videoUrl = (data as StudentRow).videoUrl;
      if (videoUrl) {
        window.open(videoUrl, '_blank');
      }
    }
  }

  clearSelectedStudent(): void {
    this.selectedStudent = null;
    this.violations = [];
    this.violationRows = [];
  }

  getViolationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'EYE_GAZE': 'Nhìn ra ngoài',
      'VOICE': 'Phát hiện giọng nói',
      'FACE_PRESENCE': 'Không có mặt'
    };
    return labels[type] ?? type;
  }
}

interface StudentRow extends ExamStudent, TableRowData {
  status: string;
  statusColor: string;
  video: string;
  videoUrl: string | null;
}

interface ViolationRow extends ViolationLog, TableRowData {
  violationTypeLabel: string;
}

