import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Category } from '../shared/models';

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<Category[]> {
    return this.apiService.get<Category[]>('categories');
  }

  getActive(): Observable<Category[]> {
    return this.apiService.get<Category[]>('categories/active');
  }

  getOne(id: string): Observable<Category> {
    return this.apiService.get<Category>(`categories/${id}`);
  }

  create(data: CreateCategoryDto): Observable<Category> {
    return this.apiService.post<Category>('categories', data);
  }

  update(id: string, data: Partial<CreateCategoryDto>): Observable<Category> {
    return this.apiService.patch<Category>(`categories/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`categories/${id}`);
  }

  toggleActive(id: string): Observable<Category> {
    return this.apiService.patch<Category>(`categories/${id}/toggle`, {});
  }
}
