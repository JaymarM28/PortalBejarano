import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { User } from '../shared/models';

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  houseId: string;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  fullName?: string;
  houseId?: string;
  isActive?: boolean;
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
    // Asegurar que houseId se envíe en el body
    const payload = {
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      houseId: data.houseId
    };
    return this.apiService.post<User>('users', payload);
  }

  update(id: string, data: UpdateUserDto): Observable<User> {
    // Construir payload solo con campos definidos
    const payload: any = {};
    
    if (data.email !== undefined) payload.email = data.email;
    if (data.password !== undefined && data.password !== '') payload.password = data.password;
    if (data.fullName !== undefined) payload.fullName = data.fullName;
    if (data.houseId !== undefined) payload.houseId = data.houseId;
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    
    return this.apiService.patch<User>(`users/${id}`, payload);
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