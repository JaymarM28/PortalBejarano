import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { User } from '../shared/models';

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<User[]> {
    return this.apiService.get<User[]>('users');
  }

  getOne(id: string): Observable<User> {
    return this.apiService.get<User>(`users/${id}`);
  }

  create(data: CreateUserDto): Observable<User> {
    return this.apiService.post<User>('users', data);
  }

  update(id: string, data: Partial<CreateUserDto>): Observable<User> {
    return this.apiService.patch<User>(`users/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`users/${id}`);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.apiService.patch<{ message: string }>('users/me/password', {
      currentPassword,
      newPassword
    });
  }
}
