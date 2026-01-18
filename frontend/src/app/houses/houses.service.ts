import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { House } from '../shared/models';

export interface CreateHouseDto {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateHouseDto {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HousesService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<House[]> {
    return this.apiService.get<House[]>('houses');
  }

  getOne(id: string): Observable<House> {
    return this.apiService.get<House>(`houses/${id}`);
  }

  create(data: CreateHouseDto): Observable<House> {
    return this.apiService.post<House>('houses', data);
  }

  update(id: string, data: UpdateHouseDto): Observable<House> {
    return this.apiService.patch<House>(`houses/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`houses/${id}`);
  }
}