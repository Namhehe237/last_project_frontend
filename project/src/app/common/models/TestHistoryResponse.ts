export interface TestHistoryResponse {
  examId: number;
  examName: string;
  subjectName: string;
  score: number | null;
  totalQuestions: number;
  correctAnswers: number;
  submitTime: string | null;
  videoUrl: string | null;
  status: string | null;
}

