export interface Post {
  postId: number;
  classId: number;
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  teacherAvatarUrl?: string | null;
  title: string;
  content: string;
  postType: 'ANNOUNCEMENT' | 'ASSIGNMENT';
  dueDate?: string | null;
  totalPoints?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  commentCount: number;
  isSubmitted?: boolean | null;
  attachmentUrl?: string | null;
}

