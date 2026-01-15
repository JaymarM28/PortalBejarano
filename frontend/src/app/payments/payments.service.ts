import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Payment } from '../shared/models';

export interface CreatePaymentDto {
  employeeId: string;
  paymentDate: string;
  baseSalary: number;
  bonuses?: number;
  deductions?: number;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  constructor(private apiService: ApiService) {}

  getAll(): Observable<Payment[]> {
    return this.apiService.get<Payment[]>('payments');
  }

  getOne(id: string): Observable<Payment> {
    return this.apiService.get<Payment>(`payments/${id}`);
  }

  create(data: CreatePaymentDto): Observable<Payment> {
    return this.apiService.post<Payment>('payments', data);
  }

  update(id: string, data: Partial<CreatePaymentDto>): Observable<Payment> {
    return this.apiService.patch<Payment>(`payments/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.apiService.delete<void>(`payments/${id}`);
  }

  signPayment(id: string, signature: string): Observable<Payment> {
    return this.apiService.post<Payment>(`payments/${id}/sign`, {
      digitalSignature: signature
    });
  }

  uploadSignedDocument(id: string, file: File): Observable<Payment> {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.uploadFile(`payments/${id}/upload-signed`, formData);
  }

  downloadPDF(id: string): Observable<Blob> {
    return this.apiService.downloadFile(`payments/${id}/pdf`);
  }
}
