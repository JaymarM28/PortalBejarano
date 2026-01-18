import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';

export interface CreateMarketExpenseDto {
  date: Date | string;
  place: string;
  amount: number;
  notes?: string;
  category?: string;
  responsibleId: string;
  houseId: string;
}

@Injectable({
  providedIn: 'root'
})
export class MarketExpensesService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<any[]> {
    return this.apiService.get<any[]>('market-expenses');
  }

  getOne(id: string): Observable<any> {
    return this.apiService.get<any>(`market-expenses/${id}`);
  }

  create(data: CreateMarketExpenseDto): Observable<any> {
    return this.apiService.post<any>('market-expenses', data);
  }

  update(id: string, data: Partial<CreateMarketExpenseDto>): Observable<any> {
    return this.apiService.patch<any>(`market-expenses/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`market-expenses/${id}`);
  }

  getStatsByMonth(year: number, month: number): Observable<any> {
    return this.apiService.get<any>(`market-expenses/stats/month?year=${year}&month=${month}`);
  }

  getGeneralStats(): Observable<any> {
    return this.apiService.get<any>('market-expenses/stats/general');
  }
}
