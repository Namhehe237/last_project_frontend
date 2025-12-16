export interface Assignment {
    assignmentId: number;
    title: string;
    description?: string;
    dueDate: string;
    createdAt: string;
    status: string;
    totalPoints?: number;
    earnedPoints?: number;
    teacherName?: string;
}