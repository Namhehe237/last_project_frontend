import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Comment } from '#common/models/Comment';
import { CommentService } from '#common/services/comment.service';
import { NotificationService } from '#common/services/notification.service';
import { AuthService } from '#common/services/auth.service';
import { UserService } from '#common/services/user.service';
import { UserInfoResponse } from '#common/models/UserInfoResponse';

@Component({
  selector: 'app-comment-section',
  imports: [CommonModule, FormsModule],
  templateUrl: './comment-section.html',
  styleUrl: './comment-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentSectionComponent implements OnInit {
  readonly #commentService = inject(CommentService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly #auth = inject(AuthService);
  readonly #userService = inject(UserService);

  readonly postId = input.required<number>();
  readonly commentCount = input<number>(0);

  readonly commentCountChanged = output<void>();

  readonly comments = signal<Comment[]>([]);
  newComment = '';
  replyingTo: number | null = null;
  replyContent = '';
  editingCommentId: number | null = null;
  editContent = '';
  readonly isLoading = signal<boolean>(false);
  readonly showComments = signal<boolean>(false);
  readonly currentUser = signal<UserInfoResponse | null>(null);

  private hasLoadedComments = false;

  constructor() {
    // Load comments when postId is available (after component initialization)
    effect(() => {
      const postId = this.postId();
      if (postId && !this.hasLoadedComments && !this.isLoading()) {
        this.hasLoadedComments = true;
        this.loadComments();
      }
    });
  }

  ngOnInit(): void {
    // Load current user info
    this.loadCurrentUserInfo();
    
    // Try to load comments on init if postId is available
    const postId = this.postId();
    if (postId && this.comments().length === 0) {
      this.loadComments();
    }
  }

  loadCurrentUserInfo(): void {
    const userId = this.#auth.userId;
    if (!userId) {
      return;
    }

    this.#userService.getUserInfo(userId).subscribe({
      next: (userInfo) => {
        this.currentUser.set(userInfo);
        this.#cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading current user info:', error);
        // Continue without user info, will use fallback
      }
    });
  }

  loadComments(): void {
    const postId = this.postId();
    if (!postId) {
      console.warn('PostId is not set, cannot load comments');
      return;
    }

    if (this.isLoading()) {
      return; // Prevent concurrent loads
    }

    this.isLoading.set(true);

    this.#commentService.getPostComments(postId).subscribe({
      next: (data) => {
        this.comments.set(data || []);
        this.isLoading.set(false);
        this.#cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.#notificationService.show('Không thể tải bình luận', 'error');
        this.comments.set([]);
        this.isLoading.set(false);
        this.#cdr.markForCheck();
      }
    });
  }

  toggleComments(): void {
    const wasShowing = this.showComments();
    this.showComments.set(!wasShowing);
    
    // Load comments when showing for the first time
    if (!wasShowing && this.comments().length === 0 && !this.isLoading()) {
      this.loadComments();
    }
    this.#cdr.markForCheck();
  }

  submitComment(): void {
    if (!this.newComment.trim()) {
      return;
    }

    this.#commentService.createComment(this.postId(), {
      content: this.newComment,
      parentCommentId: undefined
    }).subscribe({
      next: () => {
        this.newComment = '';
        this.loadComments();
        this.commentCountChanged.emit();
      },
      error: (error) => {
        console.error('Error creating comment:', error);
        this.#notificationService.show('Không thể thêm bình luận', 'error');
      }
    });
  }

  startReply(parentCommentId: number): void {
    this.replyingTo = parentCommentId;
    this.replyContent = '';
    this.#cdr.markForCheck();
  }

  cancelReply(): void {
    this.replyingTo = null;
    this.replyContent = '';
    this.#cdr.markForCheck();
  }

  submitReply(parentCommentId: number): void {
    if (!this.replyContent.trim()) {
      return;
    }

    this.#commentService.createComment(this.postId(), {
      content: this.replyContent,
      parentCommentId: parentCommentId
    }).subscribe({
      next: () => {
        this.replyingTo = null;
        this.replyContent = '';
        this.loadComments();
        this.commentCountChanged.emit();
      },
      error: (error) => {
        console.error('Error creating reply:', error);
        this.#notificationService.show('Không thể thêm phản hồi', 'error');
      }
    });
  }

  startEdit(comment: Comment): void {
    this.editingCommentId = comment.commentId;
    this.editContent = comment.content;
    this.#cdr.markForCheck();
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editContent = '';
    this.#cdr.markForCheck();
  }

  saveEdit(commentId: number): void {
    if (!this.editContent.trim()) {
      return;
    }

    this.#commentService.updateComment(commentId, this.editContent).subscribe({
      next: () => {
        this.editingCommentId = null;
        this.editContent = '';
        this.loadComments();
      },
      error: (error) => {
        console.error('Error updating comment:', error);
        this.#notificationService.show('Không thể cập nhật bình luận', 'error');
      }
    });
  }

  deleteComment(commentId: number): void {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return;
    }

    this.#commentService.deleteComment(commentId).subscribe({
      next: () => {
        this.loadComments();
        this.commentCountChanged.emit();
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
        this.#notificationService.show('Không thể xóa bình luận', 'error');
      }
    });
  }

  isAuthor(comment: Comment): boolean {
    return comment.userId === this.#auth.userId;
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

  getInitials(): string {
    const user = this.currentUser();
    if (!user?.fullName) return '?';
    const parts = user.fullName.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] ?? '';
      const last = parts[parts.length - 1]?.[0] ?? '';
      return (first + last).toUpperCase();
    }
    return user.fullName.trim()[0]?.toUpperCase() ?? '?';
  }

  getCurrentUserAvatarUrl(): string | null {
    const user = this.currentUser();
    return user?.avatarUrl ?? null;
  }

  getCurrentUserName(): string {
    const user = this.currentUser();
    return user?.fullName ?? 'User';
  }

  onCurrentUserAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Hide image and show fallback initials when image fails to load
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.avatar-circle-small')) {
      const fallback = document.createElement('div');
      fallback.className = 'avatar-circle-small';
      fallback.textContent = this.getInitials();
      parent.appendChild(fallback);
      this.#cdr.markForCheck();
    }
  }

  getCommentInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] ?? '';
      const last = parts[parts.length - 1]?.[0] ?? '';
      return (first + last).toUpperCase();
    }
    return name.trim()[0]?.toUpperCase() ?? '?';
  }

  onAvatarError(event: Event, userName: string): void {
    const img = event.target as HTMLImageElement;
    // Hide image and show fallback initials when image fails to load
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.avatar-circle-small')) {
      const fallback = document.createElement('div');
      fallback.className = 'avatar-circle-small';
      fallback.textContent = this.getCommentInitials(userName);
      parent.appendChild(fallback);
      this.#cdr.markForCheck();
    }
  }

}

