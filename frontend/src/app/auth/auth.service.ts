import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { User, LoginRequest, LoginResponse } from '../shared/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      this.currentUserSubject.next(JSON.parse(userStr));
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('auth/login', credentials).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('current_user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'super_admin';
  }

   isHouseAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin_house';
  } 

  getHouseId(): string | null {
    const user = this.getCurrentUser();
    return user?.houseId || null;
  }

  canManageUsers(): boolean {
    return this.isHouseAdmin() || this.isSuperAdmin();
  }
}