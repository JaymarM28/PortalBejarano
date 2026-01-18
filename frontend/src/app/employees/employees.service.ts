import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Employee } from '../shared/models';

export interface CreateEmployeeDto {
  fullName: string;
  documentId: string;
  phone?: string;
  address?: string;
  position?: string;
  baseSalary?: number;
  houseId: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeesService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<Employee[]> {
    return this.apiService.get<Employee[]>('employees');
  }

  getOne(id: string): Observable<Employee> {
    return this.apiService.get<Employee>(`employees/${id}`);
  }

  create(data: CreateEmployeeDto): Observable<Employee> {
    return this.apiService.post<Employee>('employees', data);
  }

  update(id: string, data: Partial<CreateEmployeeDto>): Observable<Employee> {
    return this.apiService.patch<Employee>(`employees/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`employees/${id}`);
  }
}
