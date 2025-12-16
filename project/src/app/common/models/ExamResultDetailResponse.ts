export interface ExamResultDetailResponse {
  examId: number;
  examName: string;
  subjectName: string;
  score: number | null;
  totalQuestions: number;
  correctAnswers: number;
  submitTime: string | null;
  questions: QuestionResultDetail[];
}

export interface QuestionResultDetail {
  questionId: number;
  questionText: string;
  answers: AnswerDetail[];
  chosenAnswerId: number | null;
  correctAnswerId: number | null;
  isCorrect: boolean;
}

export interface AnswerDetail {
  answerId: number;
  answerText: string;
  isCorrect: boolean;
}

