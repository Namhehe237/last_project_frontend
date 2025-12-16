export interface Comment {
  commentId: number;
  postId: number;
  userId: number;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string | null;
  parentCommentId?: number | null;
  content: string;
  createdAt: string;
  updatedAt?: string | null;
  replies?: Comment[];
}

