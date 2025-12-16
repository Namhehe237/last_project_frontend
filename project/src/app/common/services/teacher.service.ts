import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import { TeacherOption } from '../models/TeacherOption';
import { ListTeacherResponse } from '../models/ListTeacherResponse';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  readonly #http = inject(HttpClient);

  getListTeacher(): Observable<TeacherOption[]> {
    return this.#http.post<TeacherOption[]>('general/teachers', {});
  }

  searchTeachers(page: number, pageSize: number, searchTerm: string): Observable<ListTeacherResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(pageSize));
    const body = searchTerm ? { search: searchTerm } : {};
    return this.#http.post<ListTeacherResponse>('general/teachers', body, { params });
  }
  
}
