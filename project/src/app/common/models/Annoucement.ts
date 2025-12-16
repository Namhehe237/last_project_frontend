export interface Annoucement {
    announcementId: number;
    title: string;
    content: string;
    createdAt: string;
    teacherName?: string;
    teacherEmail?: string;
    isImportant?: boolean;
}