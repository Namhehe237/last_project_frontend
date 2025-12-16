import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import { ListClassContent } from '../models/ListClassResponse';
import {ClassDetailResponse} from '../models/ClassDetailResponse';
import { Assignment } from '#common/models/Assignment';
import { Annoucement } from '#common/models/Annoucement';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  readonly #http = inject(HttpClient);

  getStudentClassList(studentId: number): Observable<ListClassContent[]> {
    const body = {
      studentId: studentId
    };
    return this.#http.post<ListClassContent[]>('student/classes', body);
  }

  requestJoinClass(studentId: number, classCode: string): Observable<string> {
    const body = {
      studentId: studentId,
      classCode: classCode
    };
    return this.#http.post('student/classes/request-join', body, { responseType: 'text' });
  }

  leaveClass(studentId: number, classId: number): Observable<string> {
    const body = {
      studentId: studentId,
      classId: classId
    };
    return this.#http.post('student/classes/leave', body, { responseType: 'text' });
  }

  getClassDetail(studentId: number, classId: number): Observable<ClassDetailResponse> {
    const body = {
      studentId: studentId,
      classId: classId
    };
    return this.#http.post<ClassDetailResponse>('student/classes/details', body);
  }

  getStudentClassAssignments(studentId: number, classId: number): Observable<Assignment[]> {
    const body = {
      studentId: studentId,
      classId: classId
    };
    return this.#http.post<Assignment[]>('student/classes/assignments', body);
  }

  getStudentClassAnnouncements(studentId: number, classId: number): Observable<Annoucement[]> {
    const body = {
      studentId: studentId,
      classId: classId
    };
    return this.#http.post<Annoucement[]>('student/classes/announcements', body);
  }
  
}
