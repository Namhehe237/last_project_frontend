import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ListQuestionResponse} from '../models/ListQuestionResponse';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  readonly #http = inject(HttpClient);

  updateQuestion(questionId: number, questionText?: string, questionType?: string, difficultyLevel?: string, subjectName?: string, teacherId?: number, answer?: string[]): Observable<string> {
    const body = {
      questionText: questionText,
      questionType: questionType,
      difficultyLevel: difficultyLevel,
      subjectName: subjectName,
      teacherId: teacherId,
      answer: answer
    };
    return this.#http.post(`question/update/${questionId}`, body, { responseType: 'text' });
  }

  getListQuestion(page: number, size: number, difficultyLevel?: string, subjectName?: string, teacherName?: string): Observable<ListQuestionResponse> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    const body = {
      difficultyLevel: difficultyLevel,
      subjectName: subjectName,
      teacherName: teacherName
    };
    return this.#http.post<ListQuestionResponse>('question/list-question', body, { params });
  }

  addQuestion(questionText: string, questionType: string, difficultyLevel: string, subjectName: string, teacherId: number, answer: string[]): Observable<string> {
    const body = {
      questionText: questionText,
      questionType: questionType,
      difficultyLevel: difficultyLevel,
      subjectName: subjectName,
      teacherId: teacherId,
      answer: answer
    };
    return this.#http.post('question/add-question', body, { responseType: 'text' });
  }

  deleteQuestion(questionId: number[]): Observable<string> {
    const body = {
      questionId: questionId
    };
    return this.#http.delete('question', { body, responseType: 'text' });
  }

  downloadQuestionTemplate(): Observable<Blob> {
    return this.#http.get('question/template', { responseType: 'blob' });
  }

  uploadQuestionExcel(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file);
    return this.#http.post('question/upload', form, { responseType: 'text' });
  }
}
