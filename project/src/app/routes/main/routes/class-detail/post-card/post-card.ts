import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input, output, viewChild, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Post } from '#common/models/Post';
import { PostService } from '#common/services/post.service';
import { NotificationService } from '#common/services/notification.service';
import { AuthService } from '#common/services/auth.service';
import { CommentSectionComponent } from '../comment-section/comment-section';
import { AssignmentSubmitDialogComponent } from '../assignment-submit-dialog/assignment-submit-dialog';
import { AssignmentDetailDialogComponent } from '../assignment-detail-dialog/assignment-detail-dialog';

@Component({
  selector: 'app-post-card',
  imports: [CommonModule, FormsModule, CommentSectionComponent, AssignmentSubmitDialogComponent, AssignmentDetailDialogComponent],
  templateUrl: './post-card.html',
  styleUrl: './post-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardComponent {
  readonly #postService = inject(PostService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly #auth = inject(AuthService);

  readonly post = input.required<Post>();
  readonly classId = input.required<number>();
  readonly postDeleted = output<void>();
  readonly postUpdated = output<void>();

  readonly submitDialog = viewChild<AssignmentSubmitDialogComponent>('submitDialog');
  readonly detailDialog = viewChild<AssignmentDetailDialogComponent>('detailDialog');

  isEditing = false;
  editTitle = '';
  editContent = '';
  editDueDate = '';
  editTotalPoints: number | null = null;
  readonly showSubmitDialog = signal(false);
  readonly showDetailDialog = signal(false);

  constructor() {
    effect(() => {
      if (this.showSubmitDialog() && this.submitDialog()) {
        setTimeout(() => {
          this.submitDialog()?.open();
        }, 0);
      }
    });

    effect(() => {
      if (this.showDetailDialog() && this.detailDialog()) {
        setTimeout(() => {
          this.detailDialog()?.open();
        }, 0);
      }
    });
  }

  get isAuthor(): boolean {
    return this.post().teacherId === this.#auth.userId;
  }

  get isAssignment(): boolean {
    return this.post().postType === 'ASSIGNMENT';
  }

  get isPastDue(): boolean {
    const dueDate = this.post().dueDate;
    if (!dueDate) return false;
    const due = new Date(dueDate).getTime();
    return Number.isFinite(due) && due < Date.now();
  }

  get canSubmit(): boolean {
    return this.isAssignment && !this.post().isSubmitted && !this.isAuthor;
  }

  startEdit(): void {
    this.isEditing = true;
    this.editTitle = this.post().title;
    this.editContent = this.post().content;
    const dueDate = this.post().dueDate;
    if (dueDate) {
      try {
        this.editDueDate = new Date(dueDate).toISOString().slice(0, 16);
      } catch {
        this.editDueDate = '';
      }
    } else {
      this.editDueDate = '';
    }
    this.editTotalPoints = this.post().totalPoints ?? null;
    this.#cdr.markForCheck();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editTitle = '';
    this.editContent = '';
    this.editDueDate = '';
    this.editTotalPoints = null;
    this.#cdr.markForCheck();
  }

  saveEdit(): void {
    if (!this.editTitle.trim() || !this.editContent.trim()) {
      this.#notificationService.show('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    if (this.isAssignment && !this.editDueDate) {
      this.#notificationService.show('Vui lòng nhập ngày hết hạn', 'error');
      return;
    }

    const updateData = {
      title: this.editTitle,
      content: this.editContent,
      dueDate: this.isAssignment ? this.editDueDate : undefined,
      totalPoints: this.isAssignment ? (this.editTotalPoints ?? undefined) : undefined
    };

    this.#postService.updatePost(this.post().postId, updateData).subscribe({
      next: () => {
        this.#notificationService.show('Cập nhật bài đăng thành công!', 'success');
        this.isEditing = false;
        this.postUpdated.emit();
        this.#cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error updating post:', error);
        this.#notificationService.show('Không thể cập nhật bài đăng', 'error');
      }
    });
  }

  deletePost(): void {
    if (!confirm('Bạn có chắc chắn muốn xóa bài đăng này?')) {
      return;
    }

    this.#postService.deletePost(this.post().postId).subscribe({
      next: () => {
        this.#notificationService.show('Xóa bài đăng thành công!', 'success');
        this.postDeleted.emit();
      },
      error: (error) => {
        console.error('Error deleting post:', error);
        this.#notificationService.show('Không thể xóa bài đăng', 'error');
      }
    });
  }

  openSubmitDialog(): void {
    if (this.isPastDue) {
      this.#notificationService.show('Đã quá hạn nộp bài', 'error');
      return;
    }
    this.showSubmitDialog.set(true);
  }

  onSubmissionSubmitted(): void {
    this.showSubmitDialog.set(false);
    this.postUpdated.emit();
  }

  onDialogClosed(): void {
    this.showSubmitDialog.set(false);
  }

  openDetailDialog(): void {
    this.showDetailDialog.set(true);
  }

  onDetailDialogClosed(): void {
    this.showDetailDialog.set(false);
  }

  getAttachmentFileName(url: string | null | undefined): string {
    if (!url) return 'attachment';
    
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      const parts = pathname.split('/');
      let fileName = parts[parts.length - 1] ?? 'attachment';
      
      if (!fileName?.includes('.')) {
        const extensionPattern = /\/([^/]+\.(docx?|xlsx?|pdf|pptx?))$/i;
        const match = extensionPattern.exec(pathname);
        if (match?.[1]) {
          fileName = match[1];
        } else {
          fileName = 'attachment.xlsx';
        }
      }
      
      const validExtensions = ['.docx', '.doc', '.xlsx', '.xls', '.pdf', '.pptx', '.ppt'];
      const hasValidExtension = validExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
      
      if (!hasValidExtension) {
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
      return 'attachment.xlsx';
    }
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${day} thg ${month}, ${year}`;
    } catch {
      return '';
    }
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.avatar-circle')) {
      const fallback = document.createElement('div');
      fallback.className = 'avatar-circle';
      fallback.textContent = this.getInitials(this.post().teacherName);
      parent.appendChild(fallback);
      this.#cdr.markForCheck();
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] ?? '';
      const last = parts[parts.length - 1]?.[0] ?? '';
      return (first + last).toUpperCase();
    }
    return name.trim()[0]?.toUpperCase() ?? '?';
  }

  extractUrls(text: string): { text: string; isUrl: boolean }[] {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts: { text: string; isUrl: boolean }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, match.index), isUrl: false });
      }
      parts.push({ text: match[0], isUrl: true });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), isUrl: false });
    }

    return parts.length > 0 ? parts : [{ text, isUrl: false }];
  }
}

