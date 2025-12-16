export interface Grade {
    examId: number;
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    details: GradeDetail[];
}

export interface GradeDetail {
    questionId: number;
    choosenAnswerId: number;
    correct: boolean;
}