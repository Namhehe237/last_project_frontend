export interface ListQuestionResponse {
    totalElements: number;
    totalPages: number;
    content?: ListQuestionContent[];
}

export interface ListQuestionContent {
    questionId: number;
    questionText: string;
    questionType: string;
    difficultyLevel: string;
    subjectName: string;
    teacherName: string;
    answers: Answer[];
}

export interface Answer {
    answerText: string;
    correct: boolean;
}