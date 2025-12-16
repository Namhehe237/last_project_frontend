export interface ExamDetailResponse {
    examId: number;
    examName: string;
    subjectName: string;
    durationMinutes: number;
    maxAttempts: number;
    className: string;
    teacherName: string;
    questionId: number[];
    createdAt: string;
}
