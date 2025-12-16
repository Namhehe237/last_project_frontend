import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import { UserInfoResponse } from '#common/models/UserInfoResponse';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  readonly #http = inject(HttpClient);

  getUserInfo(userId: number): Observable<UserInfoResponse> {
  return this.#http.post<UserInfoResponse>(`general/user-info/${userId}`, {});
}

  updateUserInfo(userId: number, email?: string, password?: string ,fullName?: string, phoneNumber?: string, avatarUrl?: string): Observable<string> {
  	const body = {
      email: email,
    	password: password,
    	fullName: fullName,
    	phoneNumber: phoneNumber,
    	avatarUrl: avatarUrl
  	};
    return this.#http.post(`general/update-info/${userId}`, body, {responseType: 'text'});
  }

  uploadAvatar(avatarFile: File): Observable<string> {
    const formData = new FormData();
    formData.append('avatar', avatarFile, avatarFile.name);
    
    console.log('Uploading avatar - fileName:', avatarFile.name, 'fileSize:', avatarFile.size, 'fileType:', avatarFile.type);
    
    return this.#http.post<string>('student/upload-avatar', formData, { 
      responseType: 'text' as 'json'
    });
  }
}
