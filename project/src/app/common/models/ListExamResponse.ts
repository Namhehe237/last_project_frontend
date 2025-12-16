import {ExamDetailResponse} from './ExamDetailResponse';

export interface ListExamResponse {
    totalElements: number;
    totalPages: number;
    content?: ExamDetailResponse[];
}