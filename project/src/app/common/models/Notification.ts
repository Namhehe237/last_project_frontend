export interface Notification {
    notificationId: number;
    title: string;
    message: string;
    notificationType: 'SYSTEM' | 'CLASS' | 'EXAM' | 'PERSONAL' | 'ASSIGNMENT' | 'ASSIGNMENT_DEADLINE' | 'POST' | 'COMMENT_REPLY' | 'CLASS_JOIN_REQUEST' | 'CLASS_JOIN_APPROVED';
    isRead: boolean;
    createdAt: string;
    userId?: number;
    classId?: number;
    senderId?: number;
    senderName?: string;
    className?: string;
    relatedId?: number; // examId, postId, etc. depending on type
}

export interface NotificationPage {
    content: Notification[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first?: boolean;
    last?: boolean;
    numberOfElements?: number;
}

export interface UnreadCountResponse {
    unreadCount: number;
}

