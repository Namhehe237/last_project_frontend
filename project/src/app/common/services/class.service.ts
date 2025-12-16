import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ClassDetailResponse} from '../models/ClassDetailResponse';
import { ListClassResponse } from '../models/ListClassResponse';
import { ListRequestResponse } from '../models/ListRequestResponse';
import { ListUserResponse } from '#common/models/ListUserResponse';
import { ClassOption } from '#common/models/ClassOption';

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  readonly #http = inject(HttpClient);

  deleteClass(classId: number[]): Observable<string> {
    const body = {
      classId: classId
    };

    return this.#http.post('class/delete-class', body, { responseType: 'text' });
  }

  createClass(className: string, teacherId: number, description?: string): Observable<{classId: number}> {
    const body = {
      className: className,
      teacherId: teacherId,
      description: description,
    };
    return this.#http.post<{classId: number}>('class/create-class', body);
  }

  classDetail(classId: number): Observable<ClassDetailResponse> {
    return this.#http.post<ClassDetailResponse>(`class/class-detail/${classId}`, {});
  }

  removeStudentFromClass(classId: number, listUserId: number[]): Observable<string> {
    const body = {
      listUserId: listUserId
    };
    return this.#http.post(`class/remove-student/${classId}`, body, { responseType: 'text' });
  }

  listClassOfTeacher(teacherId: number, page: number, size: number): Observable<ListClassResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.#http.post<ListClassResponse>(`class/list-class/${teacherId}`, { params });
  }

  updateClassDetail(classId: number, className?: string, classCode?: string, description?: string): Observable<string> {
    const body = {
      className: className,
      classCode: classCode,
      description: description
    };
    return this.#http.post(`class/class-detail/update/${classId}`, body, { responseType: 'text' });
  }

  getListRequest(classId: number, page: number, size: number): Observable<ListRequestResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.#http.post<ListRequestResponse>(`class/class-detail/request/${classId}`, { params });
  }

  responseRequest(classRequestId: number[], status: string): Observable<string> {
    const body = {
      classRequestId: classRequestId,
      status: status
    };
    return this.#http.post('class/request-join-class', body, { responseType: 'text' });
  }

  getListStudentOfClass(classId: number, page: number, size: number): Observable<ListUserResponse> {
    const params = new HttpParams()
      .set('classId', classId)
      .set('page', String(page))
      .set('size', String(size));
    return this.#http.post<ListUserResponse>(`class/class-detail/list-student/${classId}`, { params });
  }

  getClassOptions(teacherId: number): Observable<ClassOption[]> {
    return this.#http.post<ClassOption[]>(`class/class-options/${teacherId}`, {});
  }
}
