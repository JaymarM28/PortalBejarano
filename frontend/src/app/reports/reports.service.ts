import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(private apiService: ApiService) {}

  getSummary(year: number, month?: number): Observable<any> {
    const params = month ? `year=${year}&month=${month}` : `year=${year}`;
    return this.apiService.get<any>(`reports/summary?${params}`);
  }

  getAnnual(year: number): Observable<any> {
    return this.apiService.get<any>(`reports/annual?year=${year}`);
  }
}
