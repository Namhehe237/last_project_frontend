import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment } from '#common/models/Comment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  readonly #http = inject(HttpClient);

  createComment(postId: number, comment: {
    content: string;
    parentCommentId?: number;
  }): Observable<Comment> {
    const body = {
      postId: postId,
      content: comment.content,
      parentCommentId: comment.parentCommentId ?? null
    };
    return this.#http.post<Comment>(`class/posts/${postId}/comments`, body);
  }

  getPostComments(postId: number): Observable<Comment[]> {
    return this.#http.get<Comment[]>(`class/posts/${postId}/comments`);
  }

  updateComment(commentId: number, content: string): Observable<Comment> {
    const body = { content };
    return this.#http.put<Comment>(`class/comments/${commentId}`, body);
  }

  deleteComment(commentId: number): Observable<void> {
    return this.#http.delete<void>(`class/comments/${commentId}`);
  }
}

