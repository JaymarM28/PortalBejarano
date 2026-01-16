import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../users/user.entity';
import { Payment } from '../payments/payment.entity';
import { MarketExpense } from '../market-expenses/market-expense.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private mailerService: MailerService) {}

  async sendPaymentNotification(payment: Payment, users: User[]): Promise<void> {
    try {
      const emailPromises = users.map((user) =>
        this.mailerService.sendMail({
          to: user.email,
          subject: `Pago Registrado - ${payment.employee.fullName}`,
          template: 'payment-notification', // ✅ sin "./"
          context: {
            userName: user.fullName,
            employeeName: payment.employee.fullName,
            employerName: payment.employer.fullName,
            paymentDate: this.formatDate(payment.paymentDate),
            baseSalary: this.formatCurrency(payment.baseSalary),
            bonuses: this.formatCurrency(payment.bonuses),
            deductions: this.formatCurrency(payment.deductions),
            totalAmount: this.formatCurrency(payment.totalAmount),
            status: this.translateStatus(payment.status),
            notes: payment.notes || 'Sin notas',
            createdAt: this.formatDateTime(payment.createdAt),
          },
        })
      );

      await Promise.all(emailPromises);
      this.logger.log(`✅ Emails de pago enviados a ${users.length} usuarios`);
    } catch (error) {
      this.logger.error('❌ Error enviando emails de pago:', error);
    }
  }

  async sendExpenseNotification(expense: MarketExpense, users: User[]): Promise<void> {
    try {
      const emailPromises = users.map((user) =>
        this.mailerService.sendMail({
          to: user.email,
          subject: `Gasto Registrado - ${expense.place}`,
          template: 'expense-notification', // ✅ sin "./"
          context: {
            userName: user.fullName,
            responsibleName: expense.responsible.fullName,
            createdByName: expense.createdBy.fullName,
            date: this.formatDate(expense.date),
            place: expense.place,
            amount: this.formatCurrency(expense.amount),
            category: expense.category || 'Sin categoría',
            notes: expense.notes || 'Sin notas',
            createdAt: this.formatDateTime(expense.createdAt),
          },
        })
      );

      await Promise.all(emailPromises);
      this.logger.log(`✅ Emails de gasto enviados a ${users.length} usuarios`);
    } catch (error) {
      this.logger.error('❌ Error enviando emails de gasto:', error);
    }
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      pending: 'Pendiente',
      signed: 'Firmado',
      completed: 'Completado',
    };
    return translations[status] || status;
  }
}
