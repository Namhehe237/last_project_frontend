export interface ListClassResponse {
    totalElements: number;
    totalPages: number;
    content?: ListClassContent[];
}

export interface ListClassContent {
    classId?: number;
    className?: string;
    classCode?: string;
    description?: string;
    teacherName?: string;
    teacherEmail?: string;
    createdAt?: string;
    joinedAt?: string;
    studentCount?: number;
}