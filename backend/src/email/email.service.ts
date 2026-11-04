import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { User } from '../users/user.entity';
import { Payment } from '../payments/payment.entity';
import { MarketExpense } from '../market-expenses/market-expense.entity';
import { expenseRegisteredEmail, paymentSignedEmail } from './email-templates';
import { brandFromSender } from '../common/format';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromEmail: string;
  /** Nombre que aparece en el encabezado de los correos (nombre visible de EMAIL_FROM). */
  private brand: string;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'Portal Bejarano <onboarding@resend.dev>';
    this.brand = brandFromSender(this.fromEmail);
  }

// ==========================================
// HELPER PRIVADO PARA DELAY
// ==========================================
private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// MÉTODOS SYNC CON RATE LIMITING
// ==========================================

/**
 * Envía el comprobante de pago firmado, con el PDF adjunto, a los usuarios de la casa
 * y al trabajador (si tiene email). Los envíos se hacen de 2 en 2 con 1 s de pausa
 * por el límite de tasa de Resend. Un destinatario que falla no detiene al resto.
 */
async sendPaymentSignedNotification(payment: Payment, users: User[], pdf: Buffer): Promise<void> {
  const recipients = new Map<string, { email: string; name: string; isWorker: boolean }>();
  for (const user of users) {
    if (user.email) {
      recipients.set(user.email.toLowerCase(), { email: user.email, name: user.fullName, isWorker: false });
    }
  }
  const workerEmail = payment.employee?.email?.trim();
  if (workerEmail) {
    recipients.set(workerEmail.toLowerCase(), {
      email: workerEmail,
      name: payment.employee.fullName,
      isWorker: true,
    });
  }

  const list = [...recipients.values()];
  const filename = `comprobante-${payment.employee.fullName.replace(/[^\p{L}\p{N}]+/gu, '-')}-${String(payment.paymentDate).slice(0, 10)}.pdf`;
  const batchSize = 2;
  const delayBetweenBatches = 1000;
  let failed = 0;

  for (let i = 0; i < list.length; i += batchSize) {
    const batch = list.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (r) => {
        const { error } = await this.resend.emails.send({
          from: this.fromEmail,
          to: r.email,
          subject: `Comprobante de pago firmado - ${payment.employee.fullName}`,
          html: paymentSignedEmail(payment, {
            brand: this.brand,
            recipientName: r.name,
            isWorker: r.isWorker,
            attachmentName: filename,
          }),
          attachments: [{ filename, content: pdf }],
        });
        if (error) throw new Error(error.message);
      }),
    );

    results.forEach((res, idx) => {
      if (res.status === 'rejected') {
        failed++;
        this.logger.error(`❌ No se pudo enviar el comprobante a ${batch[idx].email}: ${res.reason?.message}`);
      }
    });

    if (i + batchSize < list.length) {
      await this.delay(delayBetweenBatches);
    }
  }

  this.logger.log(`✅ Comprobante del pago ${payment.id} enviado a ${list.length - failed}/${list.length} destinatarios`);
}

async sendExpenseNotification(expense: MarketExpense, users: User[]): Promise<void> {
  try {
    // Procesar emails de 2 en 2 con pausa de 1 segundo entre lotes
    const batchSize = 2;
    const delayBetweenBatches = 1000; // 1 segundo

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const emailPromises = batch.map((user) =>
        this.resend.emails.send({
          from: this.fromEmail,
          to: user.email,
          subject: `Nuevo gasto registrado - ${expense.place}`,
          html: expenseRegisteredEmail(expense, { brand: this.brand, recipientName: user.fullName }),
        })
      );

      await Promise.all(emailPromises);
      
      // Solo agregar delay si hay más lotes por procesar
      if (i + batchSize < users.length) {
        await this.delay(delayBetweenBatches);
      }
    }

    this.logger.log(`✅ Emails de gasto enviados a ${users.length} usuarios`);
  } catch (error) {
    this.logger.error('❌ Error enviando emails de gasto:', error);
    throw error;
  }
}

// ==========================================
// MÉTODOS ASYNC (NO BLOQUEANTES)
// ==========================================

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
}