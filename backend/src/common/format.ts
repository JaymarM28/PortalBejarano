/**
 * Formatos compartidos por los correos y el PDF del comprobante.
 */

export const APP_TIME_ZONE = process.env.APP_TIMEZONE || 'America/Bogota';

/**
 * Fechas sin hora (columnas `date`, p. ej. '2026-11-01'). Se formatean en UTC: si se
 * usara la zona local, en Colombia (UTC-5) se mostraría el día anterior.
 */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '';
  const iso = typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  const date = new Date(`${iso}T00:00:00Z`);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Fechas con hora (timestamps), mostradas en la zona horaria de la aplicación. */
export function formatDateTime(value: Date | string | null | undefined): string {
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
    timeZone: APP_TIME_ZONE,
  });
}

export function formatCurrency(amount: number | string | null | undefined): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

/** Referencia corta y legible de un UUID, p. ej. '#3176B0DF'. */
export function shortId(id: string | undefined): string {
  return id ? `#${id.slice(0, 8).toUpperCase()}` : '';
}

/** Nombre visible de un remitente tipo 'Portal Bejarano <no-reply@dominio.com>'. */
export function brandFromSender(from: string | undefined, fallback = 'Portal Bejarano'): string {
  return from?.match(/^\s*"?([^"<]+?)"?\s*</)?.[1] || fallback;
}

// ==========================================
// Monto en letras (pesos colombianos)
// ==========================================

const UNITS = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const TEENS = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const TWENTIES = ['veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

/**
 * 0-99. Siempre con apócope ("un", "veintiún", "treinta y un") porque en este
 * contexto el número precede a un sustantivo: mil, millones o pesos.
 */
function under100(n: number): string {
  if (n < 10) return n === 1 ? 'un' : UNITS[n];
  if (n < 20) return TEENS[n - 10];
  if (n < 30) return n === 21 ? 'veintiún' : TWENTIES[n - 20];
  const unit = n % 10;
  return TENS[Math.floor(n / 10)] + (unit ? ` y ${unit === 1 ? 'un' : UNITS[unit]}` : '');
}

function under1000(n: number): string {
  if (n === 100) return 'cien';
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [hundreds ? HUNDREDS[hundreds] : '', rest ? under100(rest) : ''].filter(Boolean).join(' ');
}

function underMillion(n: number): string {
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (thousands) parts.push(thousands === 1 ? 'mil' : `${under1000(thousands)} mil`);
  if (rest) parts.push(under1000(rest));
  return parts.join(' ');
}

function numberToWords(n: number): string {
  if (n === 0) return 'cero';
  const millions = Math.floor(n / 1_000_000);
  const rest = n % 1_000_000;
  const parts: string[] = [];
  if (millions) parts.push(millions === 1 ? 'un millón' : `${underMillion(millions)} millones`);
  if (rest) parts.push(underMillion(rest));
  return parts.join(' ');
}

/** Ej.: 1570000 -> 'un millón quinientos setenta mil pesos M/CTE' */
export function amountInWords(amount: number | string | null | undefined): string {
  const n = Math.round(Math.abs(Number(amount || 0)));
  const words = numberToWords(n);
  const noun = n === 1 ? 'peso' : n >= 1_000_000 && n % 1_000_000 === 0 ? 'de pesos' : 'pesos';
  return `${words} ${noun} M/CTE`;
}
