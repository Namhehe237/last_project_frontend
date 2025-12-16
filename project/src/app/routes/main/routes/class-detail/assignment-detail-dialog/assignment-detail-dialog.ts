import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '#common/models/Post';
import { AssignmentSubmissionService } from '#common/services/assignment-submission.service';
import { NotificationService } from '#common/services/notification.service';
import { AssignmentSubmitDialogComponent } from '../assignment-submit-dialog/assignment-submit-dialog';

export interface StudentSubmissionStatus {
  studentId: number;
  studentName: string;
  studentEmail: string;
  hasSubmitted: boolean;
  submissionId: number | null;
  submissionType: 'LINK' | 'FILE' | null;
  linkUrl: string | null;
  fileUrl: string | null;
  fileName: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
  earnedPoints: number | null;
}

@Component({
  selector: 'app-assignment-detail-dialog',
  imports: [CommonModule, AssignmentSubmitDialogComponent],
  templateUrl: './assignment-detail-dialog.html',
  styleUrl: './assignment-detail-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssignmentDetailDialogComponent {
  readonly #submissionService = inject(AssignmentSubmissionService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);

  private gradeTimeout: ReturnType<typeof setTimeout> | undefined;

  readonly post = input.required<Post>();
  readonly isAuthor = input.required<boolean>();
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('_assignment_detail_dialog');
  readonly submitDialog = viewChild<AssignmentSubmitDialogComponent>('submitDialog');

  readonly students = signal<StudentSubmissionStatus[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly showSubmitDialog = signal(false);
  readonly studentSubmission = signal<{ submissionId: number | null; dueDate: string | null } | null>(null);

  get isTeacher(): boolean {
    return this.isAuthor();
  }

  get isStudent(): boolean {
    return !this.isAuthor();
  }

  constructor() {
    // Effect to open submit dialog when it becomes available
    effect(() => {
      if (this.showSubmitDialog() && this.submitDialog()) {
        setTimeout(() => {
          this.submitDialog()?.open();
        }, 0);
      }
    });
  }

  open(): void {
    this.dialog().nativeElement.showModal();
    if (this.isTeacher) {
      this.loadStudentsWithSubmissions();
    } else if (this.isStudent) {
      this.loadStudentSubmission();
    }
  }

  loadStudentSubmission(): void {
    const post = this.post();
    if (!post || post.postType !== 'ASSIGNMENT') {
      return;
    }

    this.#submissionService.getStudentSubmission(post.postId).subscribe({
      next: (submission) => {
        this.studentSubmission.set({
          submissionId: submission?.submissionId ?? null,
          dueDate: post.dueDate ?? null
        });
        this.#cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading student submission:', error);
        this.studentSubmission.set({
          submissionId: null,
          dueDate: post.dueDate ?? null
        });
        this.#cdr.markForCheck();
      }
    });
  }

  canUpdateSubmission(): boolean {
    const submission = this.studentSubmission();
    if (!submission?.submissionId) {
      return false; // No submission yet
    }

    // Check if deadline has passed
    if (submission.dueDate) {
      const dueDate = new Date(submission.dueDate);
      const now = new Date();
      return now < dueDate;
    }

    return true; // No deadline, can always update
  }

  onClose(): void {
    this.closed.emit();
    this.dialog().nativeElement.close();
  }

  loadStudentsWithSubmissions(): void {
    const post = this.post();
    if (!post || post.postType !== 'ASSIGNMENT') {
      return;
    }

    this.isLoading.set(true);
    this.#submissionService.getStudentsWithSubmissionStatus(post.postId).subscribe({
      next: (data) => {
        this.students.set(data);
        this.isLoading.set(false);
        this.#cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading students with submissions:', error);
        this.#notificationService.show('Không thể tải danh sách học sinh', 'error');
        this.isLoading.set(false);
        this.#cdr.markForCheck();
      }
    });
  }

  openSubmitDialog(): void {
    this.showSubmitDialog.set(true);
  }

  onSubmissionSubmitted(): void {
    this.showSubmitDialog.set(false);
    if (this.isTeacher) {
      this.loadStudentsWithSubmissions();
    } else if (this.isStudent) {
      this.loadStudentSubmission();
    }
    this.#cdr.markForCheck();
  }

  onDialogClosed(): void {
    this.showSubmitDialog.set(false);
    this.#cdr.markForCheck();
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `${day} thg ${month}, ${year} ${hours}:${minutes.toString().padStart(2, '0')}`;
    } catch {
      return '';
    }
  }

  /**
   * Extract filename from URL and ensure it has proper extension
   */
  getAttachmentFileName(url: string | null | undefined): string {
    if (!url) return 'attachment';
    
    try {
      // Try to extract filename from URL
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Get the last part of the path
      const parts = pathname.split('/');
      let fileName = parts[parts.length - 1] ?? 'attachment';
      
      // If filename doesn't have extension, try to get it from query params or use default
      if (!fileName?.includes('.')) {
        // Check if URL has extension in the path (Cloudinary URLs might have it)
        const extensionPattern = /\/([^/]+\.(docx?|xlsx?|pdf|pptx?))$/i;
        const match = extensionPattern.exec(pathname);
        if (match?.[1]) {
          fileName = match[1];
        } else {
          // Default to .xlsx if we can't determine
          fileName = 'attachment.xlsx';
        }
      }
      
      // Ensure filename has a valid extension
      const validExtensions = ['.docx', '.doc', '.xlsx', '.xls', '.pdf', '.pptx', '.ppt'];
      const hasValidExtension = validExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
      
      if (!hasValidExtension) {
        // If no valid extension, try to detect from URL or default to .xlsx
        if (url.includes('xlsx') || url.includes('excel')) {
          fileName = fileName.replace(/\.[^.]+$/, '') + '.xlsx';
        } else if (url.includes('docx') || url.includes('word')) {
          fileName = fileName.replace(/\.[^.]+$/, '') + '.docx';
        } else if (url.includes('pdf')) {
          fileName = fileName.replace(/\.[^.]+$/, '') + '.pdf';
        } else {
          fileName = fileName.replace(/\.[^.]+$/, '') + '.xlsx';
        }
      }
      
      return fileName;
    } catch {
      // If URL parsing fails, return default
      return 'attachment.xlsx';
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  downloadFile(fileUrl: string | null, _fileName?: string | null): void {
    if (!fileUrl) return;
    window.open(fileUrl, '_blank');
  }

  updateGrade(submissionId: number | null, earnedPoints: number | null): void {
    if (!submissionId) return;
    
    const points = earnedPoints === null || earnedPoints === undefined ? null : Number(earnedPoints);
    
    this.#submissionService.updateSubmissionGrade(submissionId, points).subscribe({
      next: (updated) => {
        // Update the student in the list
        const currentStudents = this.students();
        const updatedStudents = currentStudents.map(s => 
          s.submissionId === submissionId ? updated : s
        );
        this.students.set(updatedStudents);
        this.#cdr.markForCheck();
        this.#notificationService.show('Đã cập nhật điểm thành công', 'success');
      },
      error: (error) => {
        console.error('Error updating grade:', error);
        this.#notificationService.show('Không thể cập nhật điểm', 'error');
      }
    });
  }

  onGradeInputChange(submissionId: number | null, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    
    // Debounce: save after user stops typing for 1 second
    if (this.gradeTimeout) {
      clearTimeout(this.gradeTimeout);
    }
    this.gradeTimeout = setTimeout(() => {
      if (value === '') {
        // Empty value means null (not graded yet)
        this.updateGrade(submissionId, null);
        return;
      }
      
      const points = parseFloat(value);
      if (isNaN(points) || points < 0) {
        // Invalid input, reset to previous value
        const student = this.students().find(s => s.submissionId === submissionId);
        if (student) {
          input.value = student.earnedPoints?.toString() ?? '';
        }
        this.#notificationService.show('Điểm không hợp lệ', 'error');
        return;
      }
      
      // Validate against max points
      const post = this.post();
      if (post.totalPoints && points > post.totalPoints) {
        this.#notificationService.show(`Điểm không được vượt quá ${post.totalPoints}`, 'error');
        const student = this.students().find(s => s.submissionId === submissionId);
        if (student) {
          input.value = student.earnedPoints?.toString() ?? '';
        }
        return;
      }
      
      this.updateGrade(submissionId, points);
    }, 1000);
  }
}

