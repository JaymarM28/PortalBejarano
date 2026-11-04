import { Payment } from '../payments/payment.entity';
import { MarketExpense } from '../market-expenses/market-expense.entity';

/**
 * Plantillas HTML de correo.
 *
 * Están maquetadas con tablas y estilos en línea a propósito: Gmail, Outlook y Apple Mail
 * no soportan de forma fiable flexbox, grid ni hojas de estilo externas.
 * Todo texto que venga de usuarios debe pasar por `escape()`.
 */

const TIME_ZONE = process.env.APP_TIMEZONE || 'America/Bogota';

const COLORS = {
  page: '#f3f4f6',
  card: '#ffffff',
  border: '#e5e7eb',
  accent: '#1e3a5f',
  text: '#111827',
  body: '#374151',
  muted: '#6b7280',
  subtle: '#9ca3af',
  soft: '#f9fafb',
  success: '#047857',
  successBg: '#ecfdf5',
  danger: '#b91c1c',
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// ==========================================
// Plantillas públicas
// ==========================================

export interface PaymentEmailOptions {
  brand: string;
  recipientName: string;
  isWorker: boolean;
  attachmentName: string;
}

export function paymentSignedEmail(payment: Payment, opts: PaymentEmailOptions): string {
  const worker = payment.employee;
  const intro = opts.isWorker
    ? `Hola ${escape(opts.recipientName)}, tu comprobante de pago fue firmado. A continuación encontrarás el detalle y el documento en PDF adjunto.`
    : `Hola ${escape(opts.recipientName)}, se firmó el comprobante de pago de <strong style="color:${COLORS.text};">${escape(worker.fullName)}</strong>. A continuación encontrarás el detalle y el documento en PDF adjunto.`;

  const details = detailsTable([
    ['Trabajador', escape(worker.fullName)],
    ['Documento', escape(worker.documentId)],
    ['Fecha de pago', formatDate(payment.paymentDate)],
    ['Firmado el', formatDateTime(payment.signedAt)],
    ['Responsable del pago', escape(payment.employer?.fullName)],
  ]);

  const amountRows: [string, string, string?][] = [['Salario base', formatCurrency(payment.baseSalary)]];
  if (Number(payment.bonuses) > 0) amountRows.push(['Bonificaciones', formatCurrency(payment.bonuses)]);
  if (Number(payment.deductions) > 0) {
    amountRows.push(['Deducciones', `&minus; ${formatCurrency(payment.deductions)}`, COLORS.danger]);
  }

  const body = [
    sectionTitle('Detalles del pago'),
    details,
    spacer(28),
    sectionTitle('Liquidación'),
    amountTable(amountRows, 'Total pagado', formatCurrency(payment.totalAmount)),
    payment.notes ? spacer(24) + notesBlock(payment.notes) : '',
    spacer(28),
    attachmentBlock(opts.attachmentName),
  ].join('');

  return layout({
    brand: opts.brand,
    preheader: `Comprobante de pago firmado · ${worker.fullName} · ${formatCurrency(payment.totalAmount)}`,
    eyebrow: 'Comprobante de pago',
    title: 'Pago firmado',
    badge: 'Firmado',
    intro,
    body,
    reference: `Comprobante ${shortId(payment.id)}`,
  });
}

export interface ExpenseEmailOptions {
  brand: string;
  recipientName: string;
}

export function expenseRegisteredEmail(expense: MarketExpense, opts: ExpenseEmailOptions): string {
  const createdBy = expense.createdBy?.fullName;
  const intro = createdBy
    ? `Hola ${escape(opts.recipientName)}, <strong style="color:${COLORS.text};">${escape(createdBy)}</strong> registró un nuevo gasto en el sistema.`
    : `Hola ${escape(opts.recipientName)}, se registró un nuevo gasto en el sistema.`;

  const body = [
    sectionTitle('Detalles del gasto'),
    detailsTable([
      ['Lugar', escape(expense.place)],
      ['Categoría', escape(expense.category || 'Sin categoría')],
      ['Fecha', formatDate(expense.date)],
      ['Responsable', escape(expense.responsible?.fullName)],
      ['Registrado el', formatDateTime(expense.createdAt)],
    ]),
    spacer(28),
    amountTable([], 'Monto total', formatCurrency(expense.amount)),
    expense.notes ? spacer(24) + notesBlock(expense.notes) : '',
  ].join('');

  return layout({
    brand: opts.brand,
    preheader: `Nuevo gasto en ${expense.place} por ${formatCurrency(expense.amount)}`,
    eyebrow: 'Gastos del hogar',
    title: 'Nuevo gasto registrado',
    intro,
    body,
    reference: `Gasto ${shortId(expense.id)}`,
  });
}

// ==========================================
// Estructura base
// ==========================================

interface LayoutOptions {
  brand: string;
  preheader: string;
  eyebrow: string;
  title: string;
  badge?: string;
  intro: string;
  body: string;
  reference?: string;
}

function layout(o: LayoutOptions): string {
  const brand = escape(o.brand);
  const badge = o.badge
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;"><tr>
         <td style="background:${COLORS.successBg};color:${COLORS.success};font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;font-family:${FONT};">&#10003;&nbsp; ${escape(o.badge)}</td>
       </tr></table>`
    : '';

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escape(o.title)}</title>
  <style>
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .card-pad { padding: 28px 22px !important; }
      .outer-pad { padding: 20px 12px !important; }
      .title { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escape(o.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.page};">
    <tr>
      <td align="center" class="outer-pad" style="padding:40px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

          <!-- Marca -->
          <tr>
            <td style="padding:0 4px 16px;font-family:${FONT};">
              <span style="font-size:15px;font-weight:700;color:${COLORS.accent};letter-spacing:0.2px;">${brand}</span>
            </td>
          </tr>

          <!-- Tarjeta -->
          <tr>
            <td style="background:${COLORS.card};border:1px solid ${COLORS.border};border-top:4px solid ${COLORS.accent};border-radius:8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="card-pad" style="padding:36px 40px;font-family:${FONT};">
                    <div style="font-size:11px;font-weight:600;color:${COLORS.muted};text-transform:uppercase;letter-spacing:1.2px;">${escape(o.eyebrow)}</div>
                    <h1 class="title" style="margin:6px 0 0;font-size:24px;line-height:1.3;font-weight:700;color:${COLORS.text};">${escape(o.title)}</h1>
                    ${badge}
                    <p style="margin:20px 0 28px;font-size:15px;line-height:1.6;color:${COLORS.body};">${o.intro}</p>
                    ${o.body}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td align="center" style="padding:24px 16px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${COLORS.subtle};">
              Este es un mensaje automático de ${brand}. Por favor no respondas a este correo.
              ${o.reference ? `<br><span style="color:${COLORS.subtle};">${escape(o.reference)}</span>` : ''}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ==========================================
// Bloques
// ==========================================

function sectionTitle(text: string): string {
  return `<div style="font-size:12px;font-weight:600;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.8px;padding-bottom:10px;border-bottom:1px solid ${COLORS.border};">${escape(text)}</div>`;
}

/** Filas etiqueta / valor. Los valores ya deben venir escapados. */
function detailsTable(rows: [string, string][]): string {
  const visible = rows.filter(([, value]) => value && value.trim() !== '');
  const html = visible
    .map(
      ([label, value], i) => `<tr>
        <td style="padding:11px 0;${i < visible.length - 1 ? `border-bottom:1px solid ${COLORS.border};` : ''}font-size:14px;color:${COLORS.muted};width:44%;vertical-align:top;font-family:${FONT};">${escape(label)}</td>
        <td style="padding:11px 0;${i < visible.length - 1 ? `border-bottom:1px solid ${COLORS.border};` : ''}font-size:14px;color:${COLORS.text};font-weight:500;text-align:right;vertical-align:top;font-family:${FONT};">${value}</td>
      </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${html}</table>`;
}

/** Desglose tipo recibo con fila de total destacada. Los montos ya vienen formateados. */
function amountTable(rows: [string, string, string?][], totalLabel: string, total: string): string {
  const lines = rows
    .map(
      ([label, amount, color]) => `<tr>
        <td style="padding:10px 0;font-size:14px;color:${COLORS.body};font-family:${FONT};">${escape(label)}</td>
        <td style="padding:10px 0;font-size:14px;color:${color || COLORS.text};text-align:right;white-space:nowrap;font-family:${FONT};">${amount}</td>
      </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    ${lines}
    <tr>
      <td style="padding:14px 0 0;${rows.length ? `border-top:2px solid ${COLORS.text};` : ''}font-size:15px;font-weight:700;color:${COLORS.text};font-family:${FONT};">${escape(totalLabel)}</td>
      <td style="padding:14px 0 0;${rows.length ? `border-top:2px solid ${COLORS.text};` : ''}font-size:22px;font-weight:700;color:${COLORS.text};text-align:right;white-space:nowrap;font-family:${FONT};">${total}</td>
    </tr>
  </table>`;
}

function notesBlock(notes: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="background:${COLORS.soft};border-left:3px solid ${COLORS.border};padding:14px 16px;font-family:${FONT};">
        <div style="font-size:12px;font-weight:600;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">Notas</div>
        <div style="font-size:14px;line-height:1.6;color:${COLORS.body};white-space:pre-line;">${escape(notes)}</div>
      </td>
    </tr>
  </table>`;
}

function attachmentBlock(filename: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${COLORS.border};border-radius:6px;">
    <tr>
      <td width="56" style="padding:14px 0 14px 16px;vertical-align:middle;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="background:${COLORS.danger};color:#ffffff;font-size:10px;font-weight:700;letter-spacing:0.5px;padding:8px 7px;border-radius:4px;font-family:${FONT};">PDF</td>
        </tr></table>
      </td>
      <td style="padding:14px 16px 14px 4px;vertical-align:middle;font-family:${FONT};">
        <div style="font-size:14px;font-weight:600;color:${COLORS.text};word-break:break-all;">${escape(filename)}</div>
        <div style="font-size:12px;color:${COLORS.muted};margin-top:2px;">Adjunto a este correo</div>
      </td>
    </tr>
  </table>`;
}

function spacer(height: number): string {
  return `<div style="height:${height}px;line-height:${height}px;font-size:1px;">&nbsp;</div>`;
}

// ==========================================
// Formato
// ==========================================

/** Escapa texto ingresado por usuarios antes de insertarlo en el HTML. */
export function escape(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Fechas sin hora (columnas `date`, p. ej. '2026-11-01'). Se formatean en UTC: si se
 * usara la zona local, en Colombia (UTC-5) se mostraría el día anterior.
 */
function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '';
  const iso = typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  const date = new Date(`${iso}T00:00:00Z`);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Fechas con hora (timestamps), mostradas en la zona horaria de la aplicación. */
function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: TIME_ZONE,
  });
}

function formatCurrency(amount: number | string | null | undefined): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function shortId(id: string | undefined): string {
  return id ? `#${id.slice(0, 8).toUpperCase()}` : '';
}
