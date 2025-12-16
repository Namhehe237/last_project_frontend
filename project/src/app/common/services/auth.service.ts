import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

export interface AuthoritiesCheck {
  allow?: boolean | Role | Role[];
}

export interface LoginRequest { email: string; password: string; }
export interface TokenResponse { accessToken: string; roleName: Role; userId: number; }
export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl: string;
  role: Role;
}


@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  get token(): string | null { return localStorage.getItem('access_token'); }
  set token(v: string | null) {
    if (v) {
      localStorage.setItem('access_token', v);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  get role(): Role | null {
    const value = localStorage.getItem('role');
    return (value as Role) ?? null;
  }
  set role(value: Role | null) {
    if (value) {
      localStorage.setItem('role', value);
    } else {
      localStorage.removeItem('role');
    }
  }

  get userId(): number | null {
    const value = localStorage.getItem('userId');
    return value ? Number(value) : null;
  }
  set userId(value: number | null) {
    if (value) {
      localStorage.setItem('userId', value.toString());
    } else {
      localStorage.removeItem('userId');
    }
  }

  clearAuthInfo(): void {
    this.token = null;
    this.role = null;
    this.userId = null;
  }


  getAuthoritiesCheck(data: AuthoritiesCheck): boolean {
    if (data.allow === undefined) return false;
    if (typeof data.allow === 'boolean') return data.allow;

    return this.hasRole(data.allow);
  }

  
login(body: LoginRequest): Observable<TokenResponse> {
  this.clearAuthInfo();

  return this.http.post<TokenResponse>('auth/login', body).pipe(
    tap(res => {
      this.token = res.accessToken;
      this.role = res.roleName;
      this.userId = res.userId;
    })
  );
}

  register(body: RegisterDto): Observable<TokenResponse> {
    this.clearAuthInfo();

    return this.http.post<TokenResponse>('auth/register', body);
  }

  hasRole(roles: Role | Role[]): boolean {
    const current = this.role;
    if (!current) return false;
    return Array.isArray(roles) ? roles.includes(current) : roles === current;
  }

  signOut(): Observable<void> {
    this.clearAuthInfo();
    return of(void 0);
  }
}
