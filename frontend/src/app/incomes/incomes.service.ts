import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Income, IncomeType } from '../shared/models';

export interface CreateIncomeDto {
  amount: number;
  description: string;
  date: string;
  type?: IncomeType;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class IncomesService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<Income[]> {
    return this.apiService.get<Income[]>('incomes');
  }

  create(data: CreateIncomeDto): Observable<Income> {
    return this.apiService.post<Income>('incomes', data);
  }

  update(id: string, data: Partial<CreateIncomeDto>): Observable<Income> {
    return this.apiService.patch<Income>(`incomes/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`incomes/${id}`);
  }

  getStatsByMonth(year: number, month: number): Observable<any> {
    return this.apiService.get<any>(`incomes/stats/month?year=${year}&month=${month}`);
  }
}
