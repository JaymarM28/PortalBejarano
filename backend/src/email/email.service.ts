import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { User } from '../users/user.entity';
import { Payment } from '../payments/payment.entity';
import { MarketExpense } from '../market-expenses/market-expense.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'Portal Bejarano <onboarding@resend.dev>';
  }

  // ==========================================
  // MÉTODOS SÍNCRONOS (ORIGINALES)
  // ==========================================

  async sendPaymentNotification(payment: Payment, users: User[]): Promise<void> {
    try {
      const emailPromises = users.map((user) =>
        this.resend.emails.send({
          from: this.fromEmail,
          to: user.email,
          subject: `Pago Registrado - ${payment.employee.fullName}`,
          html: this.getPaymentEmailHtml(payment, user),
        })
      );

      await Promise.all(emailPromises);
      this.logger.log(`✅ Emails de pago enviados a ${users.length} usuarios`);
    } catch (error) {
      this.logger.error('❌ Error enviando emails de pago:', error);
      throw error;
    }
  }

  async sendExpenseNotification(expense: MarketExpense, users: User[]): Promise<void> {
    try {
      const emailPromises = users.map((user) =>
        this.resend.emails.send({
          from: this.fromEmail,
          to: user.email,
          subject: `Gasto Registrado - ${expense.place}`,
          html: this.getExpenseEmailHtml(expense, user),
        })
      );

      await Promise.all(emailPromises);
      this.logger.log(`✅ Emails de gasto enviados a ${users.length} usuarios`);
    } catch (error) {
      this.logger.error('❌ Error enviando emails de gasto:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS ASYNC (NO BLOQUEANTES)
  // ==========================================

  sendPaymentNotificationAsync(payment: Payment, users: User[]): void {
    setImmediate(async () => {
      try {
        await this.sendPaymentNotification(payment, users);
        this.logger.log(`📧 Email de pago procesado en background para ${users.length} usuarios`);
      } catch (error) {
        this.logger.error('❌ Error en envío async de email de pago:', error);
      }
    });
  }

  sendExpenseNotificationAsync(expense: MarketExpense, users: User[]): void {
    setImmediate(async () => {
      try {
        await this.sendExpenseNotification(expense, users);
        this.logger.log(`📧 Email de gasto procesado en background para ${users.length} usuarios`);
      } catch (error) {
        this.logger.error('❌ Error en envío async de email de gasto:', error);
      }
    });
  }

  // ==========================================
  // TEMPLATES HTML
  // ==========================================

  private getPaymentEmailHtml(payment: Payment, user: User): string {
    const bonusesHtml = payment.bonuses ? `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
        <span style="font-size: 14px; color: #4a5568;">Bonificaciones</span>
        <span style="font-size: 15px; font-weight: 600; color: #059669;">${this.formatCurrency(payment.bonuses)}</span>
      </div>
    ` : '';

    const deductionsHtml = payment.deductions ? `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
        <span style="font-size: 14px; color: #4a5568;">Deducciones</span>
        <span style="font-size: 15px; font-weight: 600; color: #dc2626;">${this.formatCurrency(payment.deductions)}</span>
      </div>
    ` : '';

    const notesHtml = payment.notes ? `
      <div style="background-color: #fffbeb; border-radius: 12px; padding: 18px; margin-top: 25px; display: flex; align-items: flex-start;">
        <div style="width: 36px; height: 36px; background-color: #fef3c7; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px; flex-shrink: 0;">📝</div>
        <div style="flex: 1;">
          <div style="font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Notas</div>
          <div style="font-size: 14px; color: #78350f;">${payment.notes}</div>
        </div>
      </div>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Pago Registrado</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #edf2f7; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background-color: #1a365d; color: white; padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 600;">Nuevo Pago Registrado</h1>
      <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">Notificación del Sistema</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px 35px 35px;">
      <p style="font-size: 15px; color: #4a5568; margin-bottom: 25px;">Se ha registrado un nuevo pago en el sistema:</p>
      
      <!-- Info del Pago -->
      <div style="margin: 25px 0;">
        <div style="font-size: 13px; font-weight: 600; color: #1a365d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0;">📋 Información del Pago</div>
        
        <!-- Empleada -->
        <div style="display: flex; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="width: 36px; height: 36px; background-color: #ebf4ff; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px; flex-shrink: 0;">👩</div>
          <div style="flex: 1;">
            <div style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Empleada</div>
            <div style="font-size: 15px; color: #2d3748; font-weight: 500;">${payment.employee.fullName}</div>
          </div>
        </div>
        
        <!-- Fecha -->
        <div style="display: flex; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="width: 36px; height: 36px; background-color: #ebf4ff; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px; flex-shrink: 0;">📅</div>
          <div style="flex: 1;">
            <div style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Fecha de Pago</div>
            <div style="font-size: 15px; color: #2d3748; font-weight: 500;">${this.formatDate(payment.paymentDate)}</div>
          </div>
        </div>
        
        <!-- Empleador -->
        <div style="display: flex; align-items: flex-start; padding: 14px 0;">
          <div style="width: 36px; height: 36px; background-color: #ebf4ff; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px; flex-shrink: 0;">🏢</div>
          <div style="flex: 1;">
            <div style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Empleador</div>
            <div style="font-size: 15px; color: #2d3748; font-weight: 500;">${payment.employer.fullName}</div>
          </div>
        </div>
      </div>
      
      <!-- Money Section -->
      <div style="background-color: #f7fafc; border-radius: 12px; padding: 20px; margin: 25px 0;">
        <div style="font-size: 13px; font-weight: 600; color: #1a365d; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0;">💵 Detalles del Monto</div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
          <span style="font-size: 14px; color: #4a5568;">Salario Base</span>
          <span style="font-size: 15px; font-weight: 600; color: #2d3748;">${this.formatCurrency(payment.baseSalary)}</span>
        </div>
        
        ${bonusesHtml}
        ${deductionsHtml}
      </div>
      
      <!-- Total Amount Card -->
      <div style="background: linear-gradient(135deg, #2c5282 0%, #1a365d 100%); border-radius: 14px; padding: 25px; margin-top: 25px; text-align: center;">
        <div style="color: rgba(255,255,255,0.7); font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Total Pagado</div>
        <div style="color: white; font-size: 32px; font-weight: 700;">${this.formatCurrency(payment.totalAmount)}</div>
      </div>
      
      ${notesHtml}
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f7fafc; padding: 25px 35px; text-align: center;">
      <p style="margin: 0; color: #a0aec0; font-size: 12px;">Mensaje automático del Sistema de Gestión de Pagos</p>
      <p style="margin: 5px 0 0; color: #a0aec0; font-size: 12px;">Por favor no responder a este correo</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getExpenseEmailHtml(expense: MarketExpense, user: User): string {
    const notesHtml = expense.notes ? `
      <div style="display: flex; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #e2e8f0;">
        <div style="width: 36px; height: 36px; background-color: #ebf4ff; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px; flex-shrink: 0;">📝</div>
        <div style="flex: 1;">
          <div style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Notas</div>
          <div style="font-size: 15px; color: #2d3748; font-weight: 500;">${expense.notes}</div>
        </div>
      </div>
    ` : '';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Gasto Registrado</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2d3748; background-color: #edf2f7; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background-color: #1a365d; color: white; padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 600;">Nuevo Gasto Registrado</h1>
      <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">Notificación del Sistema</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px 35px 35px;">
      <p style="font-size: 15px; color: #4a5568; margin-bottom: 25px;">Hola <strong>${user.fullName}</strong>, se ha registrado un nuevo gasto:</p>
      
      <!-- Info del Gasto -->
      <div style="margin: 25px 0;">
        
        <!-- Lugar -->
        <div style="display: flex; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="width: 36px; height: 36px; background-color: #ebf4ff; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px; flex-shrink: 0;">🏪</div>
          <div style="flex: 1;">
            <div style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Lugar</div>
            <div style="font-size: 15px; color: #2d3748; font-weight: 500;">${expense.place}</div>
          </div>
        </div>
        
        <!-- Responsable -->
        <div style="display: flex; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="width: 36px; height: 36px; background-color: #ebf4ff; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px; flex-shrink: 0;">👤</div>
          <div style="flex: 1;">
            <div style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Responsable</div>
            <div style="font-size: 15px; color: #2d3748; font-weight: 500;">${expense.responsible.fullName}</div>
          </div>
        </div>
        
        <!-- Fecha -->
        <div style="display: flex; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="width: 36px; height: 36px; background-color: #ebf4ff; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px; flex-shrink: 0;">📅</div>
          <div style="flex: 1;">
            <div style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Fecha</div>
            <div style="font-size: 15px; color: #2d3748; font-weight: 500;">${this.formatDate(expense.date)}</div>
          </div>
        </div>
        
        <!-- Categoría -->
        <div style="display: flex; align-items: flex-start; padding: 14px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="width: 36px; height: 36px; background-color: #ebf4ff; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px; flex-shrink: 0;">🏷️</div>
          <div style="flex: 1;">
            <div style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Categoría</div>
            <div style="font-size: 15px; color: #2d3748; font-weight: 500;">
              <span style="display: inline-block; padding: 5px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; background-color: #e6fffa; color: #047857;">${expense.category || 'Sin categoría'}</span>
            </div>
          </div>
        </div>
        
        ${notesHtml}
        
        <!-- Registrado por -->
        <div style="display: flex; align-items: flex-start; padding: 14px 0;">
          <div style="width: 36px; height: 36px; background-color: #ebf4ff; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px; flex-shrink: 0;">✍️</div>
          <div style="flex: 1;">
            <div style="font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Registrado por</div>
            <div style="font-size: 15px; color: #2d3748; font-weight: 500;">${expense.createdBy.fullName}</div>
          </div>
        </div>
      </div>
      
      <!-- Total Amount Card -->
      <div style="background: linear-gradient(135deg, #2c5282 0%, #1a365d 100%); border-radius: 14px; padding: 25px; margin-top: 25px; text-align: center;">
        <div style="color: rgba(255,255,255,0.7); font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Monto Total</div>
        <div style="color: white; font-size: 32px; font-weight: 700;">${this.formatCurrency(expense.amount)}</div>
      </div>
      
      <!-- Timestamp -->
      <div style="text-align: center; color: #a0aec0; font-size: 13px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        Registrado el ${this.formatDateTime(expense.createdAt)}
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f7fafc; padding: 25px 35px; text-align: center;">
      <p style="margin: 0; color: #a0aec0; font-size: 12px;">Mensaje automático del Sistema de Gestión de Pagos</p>
      <p style="margin: 5px 0 0; color: #a0aec0; font-size: 12px;">Por favor no responder a este correo</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // ==========================================
  // HELPERS
  // ==========================================

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