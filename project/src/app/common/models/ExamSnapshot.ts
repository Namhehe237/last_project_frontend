export interface ExamSnapshot {
    examId?: number;
    examName?: string;
    subjectName?: string;
    durationMinutes?: number;
    maxAttempts?: number;
    className?: string;
    startTime?: string;
    endTime?: string;
    teacherName?: string;
    questions?: ExamQuestionSnapshot[];
}

export interface ExamQuestionSnapshot {
    questionId?: number;
    questionText?: string;
    questionType?: string;
    difficultyLevel?: string;
    subjectName?: string;
    teacherName?: string;
    answers?: ExamAnswerSnapshot[];
}

export interface ExamAnswerSnapshot {
    answerId?: number;
    answerText?: string;
    correct?: boolean;
}