import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, OnInit, signal, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '#common/models/Post';
import { PostService } from '#common/services/post.service';
import { NotificationService } from '#common/services/notification.service';
import { AuthService } from '#common/services/auth.service';
import { PostCardComponent } from '../post-card/post-card';
import { CreatePostDialog } from '../create-post-dialog/create-post-dialog';

@Component({
  selector: 'app-class-feed',
  imports: [CommonModule, PostCardComponent],
  templateUrl: './class-feed.html',
  styleUrl: './class-feed.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassFeedComponent implements OnInit {
  readonly #postService = inject(PostService);
  readonly #notificationService = inject(NotificationService);
  readonly #cdr = inject(ChangeDetectorRef);
  readonly #auth = inject(AuthService);
  readonly #vcr = inject(ViewContainerRef);

  readonly classId = input.required<number>();

  readonly posts = signal<Post[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly filterType = signal<'ALL' | 'ASSIGNMENT' | 'ANNOUNCEMENT'>('ALL');

  get isTeacher(): boolean {
    return this.#auth.role === 'TEACHER' || this.#auth.role === 'ADMIN';
  }

  private initialized = false;

  constructor() {
    // Watch for classId changes and reload feed (after initial load)
    effect(() => {
      const id = this.classId();
      if (id && this.initialized) {
        // Only reload if already initialized (avoid double load in constructor)
        this.loadFeed();
      }
    });
  }

  ngOnInit(): void {
    if (this.classId()) {
      this.loadFeed();
      this.initialized = true;
    }
  }

  public loadFeed(): void {
    const id = this.classId();
    if (!id) {
      console.warn('ClassId is not set, cannot load feed');
      return;
    }

    console.log('Loading feed for classId:', id);
    this.isLoading.set(true);

    this.#postService.getClassFeed(id).subscribe({
      next: (data) => {
        console.log('Feed data received:', data);
        console.log('Posts length:', data?.length || 0);
        this.posts.set(data || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading feed:', error);
        this.#notificationService.show('Không thể tải bảng tin', 'error');
        this.posts.set([]);
        this.isLoading.set(false);
      }
    });
  }

  openCreatePostDialog(): void {
    const dialogRef = this.#vcr.createComponent(CreatePostDialog);
    
    dialogRef.setInput('classId', this.classId());
    dialogRef.setInput('compRef', dialogRef);

    dialogRef.instance.createPostResult.subscribe((success: boolean) => {
      if (success) {
        this.loadFeed();
      }
    });

    dialogRef.instance.closed.subscribe(() => {
      dialogRef.destroy();
    });

    dialogRef.instance.open();
    this.#cdr.markForCheck();
  }

  onPostDeleted(): void {
    this.loadFeed();
  }

  onPostUpdated(): void {
    this.loadFeed();
  }

  setFilter(type: 'ALL' | 'ASSIGNMENT' | 'ANNOUNCEMENT'): void {
    this.filterType.set(type);
  }

  get filteredPosts(): Post[] {
    const filter = this.filterType();
    if (filter === 'ALL') {
      return this.posts();
    }
    return this.posts().filter(post => post.postType === filter);
  }
}
