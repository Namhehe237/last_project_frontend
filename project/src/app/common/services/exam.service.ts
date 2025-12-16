import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ExamDetailResponse} from '../models/ExamDetailResponse';
import {ListExamResponse} from '../models/ListExamResponse';
import { Grade } from '#common/models/Grade';
import { ExamSnapshot } from '#common/models/ExamSnapshot';
import { TestHistoryResponse } from '#common/models/TestHistoryResponse';
import { ExamResultDetailResponse } from '#common/models/ExamResultDetailResponse';
import { RandomExamResponse } from '#common/models/RandomExamResponse';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  readonly #http = inject(HttpClient);

  getExamDetail(examId: number): Observable<ExamDetailResponse> {
    return this.#http.post<ExamDetailResponse>(`exam/get-exam-details/${examId}`, {});
  }

  getExamList(page: number, size: number, studentId?: number, classId?: number): Observable<ListExamResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    const body = {
      studentId: studentId,
      classId: classId
    };
    return this.#http.post<ListExamResponse>('exam/get-all-exam', body, { params });
  }

  createExam(examName: string, subjectName: string, durationMinutes: number, maxAttempts: number, className: string, questionId: number[], startTime: string, endTime: string, examStatus: string, teacherId: string): Observable<string> {
    const body = {
      examName: examName,
      subjectName: subjectName,
      durationMinutes: durationMinutes,
      maxAttempts: maxAttempts,
      className: className,
      questionId: questionId,
      startTime: startTime,
      endTime: endTime,
      examStatus: examStatus,
      teacherId: teacherId
    };
    return this.#http.post('exam/create-exam', body, { responseType: 'text' });
  }

  createRandomExam(examName: string, subjectName: string, durationMinutes: number, maxAttempts: number, className: string, startTime: string, endTime: string, examStatus: string, teacherId: string, easyQuestionCount: number, mediumQuestionCount: number, hardQuestionCount: number): Observable<RandomExamResponse> {
    const body = {
      examName,
      subjectName,
      durationMinutes,
      maxAttempts,
      className,
      startTime,
      endTime,
      examStatus,
      teacherId,
      easyQuestionCount,
      mediumQuestionCount,
      hardQuestionCount,
      totalQuestions: easyQuestionCount + mediumQuestionCount + hardQuestionCount
    };
    return this.#http.post<RandomExamResponse>('exam/create-random', body);
  }

  updateExamQuestions(examId: number, questionIds: number[]): Observable<string> {
    const body = { questionIds };
    return this.#http.put(`exam/questions/${examId}`, body, { responseType: 'text' });
  }

  deleteExam(examId: number[]): Observable<string> {
    const params = new HttpParams()
      .set('examId', examId.join(','));
    return this.#http.delete('exam/delete-exam', { params, responseType: 'text' });
  }

  gradeExam(examId: number, studentId: number, answers: { questionId: number; answerId: number }[]): Observable<Grade> {
    const body = {
      examId: examId,
      studentId: studentId,
      answers: answers
    };
    return this.#http.post<Grade>('exam/grade', body);
  }

  getExamSnapshot(examId: number): Observable<ExamSnapshot> {
    return this.#http.get<ExamSnapshot>(`exam/snapshot/${examId}`, {});
  }

  getExamPaper(examId: number): Observable<ExamSnapshot> {
    return this.#http.get<ExamSnapshot>(`exam/paper/${examId}`, {});
  }

  forceSubmitExam(examId: number, studentId: number, violationType: string): Observable<Grade> {
    const body = {
      examId: examId,
      studentId: studentId,
      violationType: violationType,
    };
    return this.#http.post<Grade>('exam/force-submit', body);
  }

  uploadVideo(examId: number, studentId: number, videoFile: Blob): Observable<string> {
    const formData = new FormData();
    formData.append('video', videoFile, `exam-${examId}-student-${studentId}.webm`);
    formData.append('examId', examId.toString());
    formData.append('studentId', studentId.toString());
    
    console.log('Uploading video - examId:', examId, 'studentId:', studentId, 'fileSize:', videoFile.size, 'fileType:', videoFile.type);
    
    return this.#http.post<string>('exam/upload-video', formData, { 
      responseType: 'text' as 'json'
    });
  }

  getTestHistory(): Observable<TestHistoryResponse[]> {
    return this.#http.get<TestHistoryResponse[]>('student/test-history');
  }

  getExamResultDetail(examId: number): Observable<ExamResultDetailResponse> {
    return this.#http.get<ExamResultDetailResponse>(`exam/result-detail/${examId}`);
  }
  
}
