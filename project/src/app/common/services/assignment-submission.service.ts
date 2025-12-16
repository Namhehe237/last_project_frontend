import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssignmentSubmission } from '#common/models/AssignmentSubmission';

@Injectable({
  providedIn: 'root'
})
export class AssignmentSubmissionService {
  readonly #http = inject(HttpClient);

  submitAssignment(assignmentId: number, submission: {
    submissionType: 'LINK' | 'FILE';
    linkUrl?: string;
    file?: File;
  }): Observable<AssignmentSubmission> {
    const formData = new FormData();
    formData.append('submissionType', submission.submissionType);
    
    if (submission.submissionType === 'LINK') {
      if (submission.linkUrl) {
        formData.append('linkUrl', submission.linkUrl);
      }
    } else if (submission.submissionType === 'FILE') {
      if (submission.file) {
        formData.append('file', submission.file, submission.file.name);
      }
    }

    return this.#http.post<AssignmentSubmission>(`class/assignments/${assignmentId}/submit`, formData);
  }

  updateSubmission(submissionId: number, submission: {
    submissionType: 'LINK' | 'FILE';
    linkUrl?: string;
    file?: File;
  }): Observable<AssignmentSubmission> {
    const formData = new FormData();
    formData.append('submissionType', submission.submissionType);
    
    if (submission.submissionType === 'LINK') {
      if (submission.linkUrl) {
        formData.append('linkUrl', submission.linkUrl);
      }
    } else if (submission.submissionType === 'FILE') {
      if (submission.file) {
        formData.append('file', submission.file, submission.file.name);
      }
    }

    return this.#http.put<AssignmentSubmission>(`class/submissions/${submissionId}`, formData);
  }

  getStudentSubmission(assignmentId: number): Observable<AssignmentSubmission | null> {
    return this.#http.get<AssignmentSubmission | null>(`class/assignments/${assignmentId}/submission`);
  }

  getAssignmentSubmissions(assignmentId: number): Observable<AssignmentSubmission[]> {
    return this.#http.get<AssignmentSubmission[]>(`class/assignments/${assignmentId}/submissions`);
  }

  getStudentsWithSubmissionStatus(assignmentId: number): Observable<{
    studentId: number;
    studentName: string;
    studentEmail: string;
    hasSubmitted: boolean;
    submissionId: number | null;
    submissionType: 'LINK' | 'FILE' | null;
    linkUrl: string | null;
    fileUrl: string | null;
    fileName: string | null;
    submittedAt: string | null;
    updatedAt: string | null;
    earnedPoints: number | null;
  }[]> {
    return this.#http.get<{
      studentId: number;
      studentName: string;
      studentEmail: string;
      hasSubmitted: boolean;
      submissionId: number | null;
      submissionType: 'LINK' | 'FILE' | null;
      linkUrl: string | null;
      fileUrl: string | null;
      fileName: string | null;
      submittedAt: string | null;
      updatedAt: string | null;
      earnedPoints: number | null;
    }[]>(`class/assignments/${assignmentId}/students-with-submissions`);
  }

  updateSubmissionGrade(submissionId: number, earnedPoints: number | null): Observable<{
    studentId: number;
    studentName: string;
    studentEmail: string;
    hasSubmitted: boolean;
    submissionId: number | null;
    submissionType: 'LINK' | 'FILE' | null;
    linkUrl: string | null;
    fileUrl: string | null;
    fileName: string | null;
    submittedAt: string | null;
    updatedAt: string | null;
    earnedPoints: number | null;
  }> {
    let url = `class/submissions/${submissionId}/grade`;
    if (earnedPoints !== null && earnedPoints !== undefined) {
      url += `?earnedPoints=${earnedPoints}`;
    }
    
    return this.#http.put<{
      studentId: number;
      studentName: string;
      studentEmail: string;
      hasSubmitted: boolean;
      submissionId: number | null;
      submissionType: 'LINK' | 'FILE' | null;
      linkUrl: string | null;
      fileUrl: string | null;
      fileName: string | null;
      submittedAt: string | null;
      updatedAt: string | null;
      earnedPoints: number | null;
    }>(url, null);
  }
}

