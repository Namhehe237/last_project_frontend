export interface ExamStudent {
  studentId: number;
  studentName: string;
  studentEmail: string;
  hasViolations: boolean;
  violationCount: number;
  hasTakenExam: boolean;
  videoUrl?: string | null;
}

