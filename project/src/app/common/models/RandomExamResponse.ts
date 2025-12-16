export interface RandomExamResponse {
  examId: number;
  examName: string;
  subjectName: string;
  durationMinutes: number;
  maxAttempts: number;
  className: string | null;
  startTime: string;
  endTime: string;
  examStatus: string;
  questions: RandomExamQuestionSummary[];
}

export interface RandomExamQuestionSummary {
  questionId: number;
  questionText: string;
  questionType: string;
  difficultyLevel: string;
  subjectName: string;
}

