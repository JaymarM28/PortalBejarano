import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper" *ngIf="loading">
      <!-- Skeleton para cards de empleadas -->
      <div *ngIf="type === 'employee-card'" class="skeleton-grid">
        <div *ngFor="let item of [1,2,3,4,5,6]" class="skeleton-card">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line" style="width: 80%;"></div>
          <div class="skeleton-line" style="width: 60%;"></div>
          <div class="skeleton-line" style="width: 70%;"></div>
          <div class="skeleton-actions">
            <div class="skeleton-button"></div>
            <div class="skeleton-button"></div>
          </div>
        </div>
      </div>

      <!-- Skeleton para tabla de pagos -->
      <div *ngIf="type === 'payment-table'" class="skeleton-table">
        <div *ngFor="let row of [1,2,3,4,5]" class="skeleton-row">
          <div class="skeleton-line" style="width: 150px;"></div>
          <div class="skeleton-line" style="width: 100px;"></div>
          <div class="skeleton-line" style="width: 100px;"></div>
          <div class="skeleton-line" style="width: 100px;"></div>
          <div class="skeleton-line" style="width: 100px;"></div>
          <div class="skeleton-line" style="width: 80px;"></div>
        </div>
      </div>

      <!-- Skeleton para tabla de usuarios -->
      <div *ngIf="type === 'user-table'" class="skeleton-table">
        <div *ngFor="let row of [1,2,3,4]" class="skeleton-row">
          <div class="skeleton-line" style="width: 180px;"></div>
          <div class="skeleton-line" style="width: 200px;"></div>
          <div class="skeleton-line" style="width: 100px;"></div>
          <div class="skeleton-line" style="width: 80px;"></div>
          <div class="skeleton-line" style="width: 120px;"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .skeleton-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .skeleton-line {
      height: 16px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .skeleton-title {
      height: 24px;
      width: 60%;
      margin-bottom: 16px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .skeleton-actions {
      display: flex;
      gap: 10px;
      margin-top: 16px;
    }

    .skeleton-button {
      height: 36px;
      width: 80px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 6px;
    }

    .skeleton-table {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .skeleton-row {
      display: flex;
      gap: 20px;
      padding: 16px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .skeleton-row:last-child {
      border-bottom: none;
    }
  `]
})
export class SkeletonComponent {
  @Input() loading = true;
  @Input() type: 'employee-card' | 'payment-table' | 'user-table' = 'employee-card';
}
