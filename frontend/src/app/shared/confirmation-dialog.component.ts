import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService, ConfirmationConfig } from './confirmation.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirmation-overlay" *ngIf="currentConfirmation" (click)="onCancel()">
      <div class="confirmation-dialog" 
           [class.danger]="currentConfirmation.type === 'danger'"
           [class.warning]="currentConfirmation.type === 'warning'"
           [class.info]="currentConfirmation.type === 'info'"
           (click)="$event.stopPropagation()">
        
        <div class="confirmation-icon">
          <span *ngIf="currentConfirmation.type === 'danger'">⚠️</span>
          <span *ngIf="currentConfirmation.type === 'warning'">❓</span>
          <span *ngIf="currentConfirmation.type === 'info'">ℹ️</span>
        </div>

        <h3 class="confirmation-title">{{ currentConfirmation.title }}</h3>
        <p class="confirmation-message">{{ currentConfirmation.message }}</p>

        <div class="confirmation-actions">
          <button class="btn-cancel" (click)="onCancel()">
            {{ currentConfirmation.cancelText }}
          </button>
          <button class="btn-confirm" 
                  [class.btn-danger]="currentConfirmation.type === 'danger'"
                  (click)="onConfirm()">
            {{ currentConfirmation.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .confirmation-dialog {
      background: white;
      border-radius: 12px;
      padding: 32px;
      max-width: 450px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .confirmation-icon {
      text-align: center;
      font-size: 48px;
      margin-bottom: 16px;
    }

    .confirmation-title {
      text-align: center;
      margin: 0 0 12px 0;
      color: #1f2937;
      font-size: 20px;
      font-weight: 600;
    }

    .confirmation-message {
      text-align: center;
      margin: 0 0 24px 0;
      color: #6b7280;
      font-size: 15px;
      line-height: 1.5;
    }

    .confirmation-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .btn-cancel, .btn-confirm {
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 100px;
    }

    .btn-cancel {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-cancel:hover {
      background: #e5e7eb;
    }

    .btn-confirm {
      background: #3b82f6;
      color: white;
    }

    .btn-confirm:hover {
      background: #2563eb;
    }

    .btn-confirm.btn-danger {
      background: #ef4444;
    }

    .btn-confirm.btn-danger:hover {
      background: #dc2626;
    }

    .confirmation-dialog.danger .confirmation-icon {
      color: #ef4444;
    }

    .confirmation-dialog.warning .confirmation-icon {
      color: #f59e0b;
    }

    .confirmation-dialog.info .confirmation-icon {
      color: #3b82f6;
    }

    @media (max-width: 768px) {
      .confirmation-dialog {
        padding: 24px;
      }

      .confirmation-actions {
        flex-direction: column-reverse;
      }

      .btn-cancel, .btn-confirm {
        width: 100%;
      }
    }
  `]
})
export class ConfirmationDialogComponent implements OnInit {
  currentConfirmation: (ConfirmationConfig & { resolve: (value: boolean) => void }) | null = null;

  constructor(private confirmationService: ConfirmationService) {}

  ngOnInit(): void {
    this.confirmationService.confirmation$.subscribe(confirmation => {
      this.currentConfirmation = confirmation;
    });
  }

  onConfirm(): void {
    if (this.currentConfirmation) {
      this.currentConfirmation.resolve(true);
      this.currentConfirmation = null;
    }
  }

  onCancel(): void {
    if (this.currentConfirmation) {
      this.currentConfirmation.resolve(false);
      this.currentConfirmation = null;
    }
  }
}
