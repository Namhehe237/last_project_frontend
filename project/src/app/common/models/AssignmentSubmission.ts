export interface AssignmentSubmission {
  submissionId: number;
  assignmentId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  submissionType: 'LINK' | 'FILE';
  linkUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  submittedAt: string;
  updatedAt?: string | null;
}

