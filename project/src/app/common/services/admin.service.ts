import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ListUserResponse} from '../models/ListUserResponse';
import {ListClassResponse} from '../models/ListClassResponse';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  readonly #http = inject(HttpClient);

	removeStudent(classId: string, listUserId: number[]): Observable<string> {
  	const body = {
    	listUserId: listUserId
  	};
  
  	return this.#http.post(`admin/remove-student/${classId}`, body, { responseType: 'text' });
	}

  getListUser(page: number, size: number, roleName: string): Observable<ListUserResponse> {
  	const body = {
      roleName: roleName
  	};
  	const params = new HttpParams()
    	.set('page', String(page))
    	.set('size', String(size));

  	return this.#http.post<ListUserResponse>('admin/list-user', body, { params });
	}

  getListClass(page: number, size: number): Observable<ListClassResponse> {
  	const params = new HttpParams()
    	.set('page', String(page))
    	.set('size', String(size));
  
  	return this.#http.post<ListClassResponse>('admin/list-class', { params });
	}

  deleteUser(listUserId: number[]): Observable<string> {
  	const body = {
    	listUserId: listUserId
  	};
  
  	return this.#http.post('admin/delete-user', body, { responseType: 'text' });
	}

  addUser(email: string, password: string, roleName: string, fullName?: string, phoneNumber?: string): Observable<string> {
  	const body = {
    	email: email,
    	password: password,
    	fullName: fullName,
    	phoneNumber: phoneNumber,
    	roleName: roleName
  	};
  
  	return this.#http.post('admin/add-user', body, { responseType: 'text' });
	}
}
