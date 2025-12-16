export interface ListUserResponse {
    totalElements: number;
    totalPages: number;
    content?: ListUserContent[];
}

export interface ListUserContent {
    userId?: number;
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    role?: string;
}