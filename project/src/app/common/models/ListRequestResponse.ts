export interface ListRequestResponse {
    totalElements: number;
    totalPages: number;
    content?: ListRequestContent[];
}

export interface ListRequestContent {
    requestId: number;
    studentName: string;
    studentEmail: string;
    studentCode: string;
    className: string;
    classCode: string;
    requestedAt: string;
}
