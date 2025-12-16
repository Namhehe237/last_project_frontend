import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '#common/models/Post';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  readonly #http = inject(HttpClient);

  createPost(classId: number, post: {
    title: string;
    content: string;
    postType: 'ANNOUNCEMENT' | 'ASSIGNMENT';
    dueDate?: string;
    totalPoints?: number;
    attachmentFile?: File | null;
  }): Observable<Post> {
    const formData = new FormData();
    
    // Create request object as JSON string for @RequestPart
    const requestData = {
      classId: classId,
      title: post.title,
      content: post.content,
      postType: post.postType,
      dueDate: post.dueDate ?? null,
      totalPoints: post.totalPoints ?? null
    };
    
    formData.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));
    
    // Add attachment file if provided
    if (post.attachmentFile) {
      formData.append('attachment', post.attachmentFile, post.attachmentFile.name);
    }
    
    return this.#http.post<Post>(`class/${classId}/posts`, formData);
  }

  getClassFeed(classId: number): Observable<Post[]> {
    return this.#http.get<Post[]>(`class/${classId}/feed`);
  }

  updatePost(postId: number, post: {
    title: string;
    content: string;
    dueDate?: string;
    totalPoints?: number;
  }): Observable<Post> {
    const body = {
      title: post.title,
      content: post.content,
      dueDate: post.dueDate ?? null,
      totalPoints: post.totalPoints ?? null
    };
    return this.#http.put<Post>(`class/posts/${postId}`, body);
  }

  deletePost(postId: number): Observable<void> {
    return this.#http.delete<void>(`class/posts/${postId}`);
  }
}

