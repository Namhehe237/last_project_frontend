import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ViolationLog } from '../models/ViolationLog';
import { ExamStudent } from '../models/ExamStudent';
import { TeacherExam } from '../models/TeacherExam';

@Injectable({
  providedIn: 'root'
})
export class ViolationLogService {
  readonly #http = inject(HttpClient);

  getViolations(examId: number, studentId: number): Observable<ViolationLog[]> {
    return this.#http.get<ViolationLog[]>(`exam/${examId}/student/${studentId}/violations`);
  }

  getExamStudents(examId: number): Observable<ExamStudent[]> {
    return this.#http.get<ExamStudent[]>(`exam/${examId}/students`);
  }

  getTeacherExams(teacherId: number): Observable<TeacherExam[]> {
    return this.#http.get<TeacherExam[]>(`teacher/${teacherId}/exams`);
  }
}

