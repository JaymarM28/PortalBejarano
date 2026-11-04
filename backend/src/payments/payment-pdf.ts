import PDFDocument from 'pdfkit';
import { Payment, PaymentStatus } from './payment.entity';
import { amountInWords, formatCurrency, formatDate, formatDateTime, shortId } from '../common/format';

/**
 * PDF del comprobante de pago (tamaño carta).
 *
 * Se usan las fuentes estándar de PDF (Helvetica), que cubren tildes y ñ pero no
 * símbolos como ✓ o el signo menos tipográfico: por eso solo se usan caracteres latinos.
 */

const C = {
  accent: '#1e3a5f',
  text: '#111827',
  body: '#374151',
  muted: '#6b7280',
  subtle: '#9ca3af',
  border: '#e5e7eb',
  soft: '#f9fafb',
  header: '#f3f4f6',
  danger: '#b91c1c',
};

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  [PaymentStatus.PENDING]: { label: 'PENDIENTE DE FIRMA', color: '#92400e', bg: '#fef3c7' },
  [PaymentStatus.SIGNED]: { label: 'FIRMADO', color: '#047857', bg: '#d1fae5' },
  [PaymentStatus.COMPLETED]: { label: 'COMPLETADO', color: '#047857', bg: '#d1fae5' },
};

const PAGE = { width: 612, height: 792 };
const M = 50; // margen
const L = M;
const R = PAGE.width - M;
const W = R - L;

export interface PaymentPdfOptions {
  brand: string;
}

/** Requiere las relaciones `employee` y `employer` cargadas. */
export function renderPaymentPdf(payment: Payment, opts: PaymentPdfOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ref = shortId(payment.id);
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: M,
      bufferPages: true, // necesario para escribir el pie en todas las páginas al final
      info: {
        Title: `Comprobante de pago ${ref} - ${payment.employee.fullName}`,
        Author: opts.brand,
        Subject: 'Comprobante de pago',
      },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      let y = drawHeader(doc, payment, opts.brand, ref);
      y = drawParties(doc, payment, y + 20);
      y = drawDates(doc, payment, y + 16);
      y = drawSettlement(doc, payment, y + 24);
      if (payment.notes) y = drawNotes(doc, payment.notes, y + 18);
      drawSignatures(doc, payment, y + 24);
      drawFooter(doc, opts.brand, ref);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// ==========================================
// Secciones
// ==========================================

function drawHeader(doc: PDFKit.PDFDocument, payment: Payment, brand: string, ref: string): number {
  doc.rect(0, 0, PAGE.width, 6).fill(C.accent);

  // Marca
  doc.font('Helvetica-Bold').fontSize(18).fillColor(C.accent).text(brand, L, 42, { width: W / 2, lineBreak: false });
  doc.font('Helvetica').fontSize(9).fillColor(C.muted).text('Sistema de gestión de pagos', L, 66, { width: W / 2 });

  // Título y número
  const rightW = 240;
  const rx = R - rightW;
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted)
    .text('COMPROBANTE DE PAGO', rx, 42, { width: rightW, align: 'right', characterSpacing: 1.2 });
  doc.font('Helvetica-Bold').fontSize(15).fillColor(C.text)
    .text(`No. ${ref.replace('#', '')}`, rx, 55, { width: rightW, align: 'right' });

  // Estado
  const status = STATUS[payment.status] ?? STATUS[PaymentStatus.PENDING];
  doc.font('Helvetica-Bold').fontSize(7.5);
  const pillW = doc.widthOfString(status.label, { characterSpacing: 0.6 }) + 16;
  const pillX = R - pillW;
  doc.roundedRect(pillX, 76, pillW, 16, 8).fill(status.bg);
  doc.fillColor(status.color).text(status.label, pillX, 80.5, { width: pillW, align: 'center', characterSpacing: 0.6 });

  const y = 108;
  doc.moveTo(L, y).lineTo(R, y).lineWidth(1).strokeColor(C.border).stroke();
  return y;
}

function drawParties(doc: PDFKit.PDFDocument, payment: Payment, top: number): number {
  const gap = 16;
  const boxW = (W - gap) / 2;
  const worker = payment.employee;

  const workerLines: [string, string][] = [['Documento', worker.documentId]];
  if (worker.position) workerLines.push(['Cargo', worker.position]);
  if (worker.phone) workerLines.push(['Teléfono', worker.phone]);

  const employerLines: [string, string][] = [];
  if (payment.employer?.email) employerLines.push(['Email', payment.employer.email]);

  const lines = Math.max(workerLines.length, employerLines.length, 1);
  const boxH = 54 + lines * 15;

  partyBox(doc, L, top, boxW, boxH, 'TRABAJADOR', worker.fullName, workerLines);
  partyBox(doc, L + boxW + gap, top, boxW, boxH, 'RESPONSABLE DEL PAGO', payment.employer?.fullName ?? '-', employerLines);
  return top + boxH;
}

function partyBox(
  doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number,
  title: string, name: string, lines: [string, string][],
): void {
  doc.roundedRect(x, y, w, h, 6).fillAndStroke(C.soft, C.border);
  const pad = 14;
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.muted)
    .text(title, x + pad, y + pad, { width: w - pad * 2, characterSpacing: 1 });
  doc.font('Helvetica-Bold').fontSize(12).fillColor(C.text)
    .text(name, x + pad, y + pad + 14, { width: w - pad * 2, lineBreak: false, ellipsis: true });

  let ly = y + pad + 36;
  for (const [label, value] of lines) {
    doc.font('Helvetica').fontSize(9).fillColor(C.muted).text(`${label}:`, x + pad, ly, { continued: true });
    doc.fillColor(C.body).text(` ${value}`, { width: w - pad * 2, lineBreak: false, ellipsis: true });
    ly += 15;
  }
}

function drawDates(doc: PDFKit.PDFDocument, payment: Payment, top: number): number {
  const cells: [string, string][] = [
    ['FECHA DE PAGO', formatDate(payment.paymentDate)],
    ['FECHA DE FIRMA', payment.signedAt ? formatDateTime(payment.signedAt) : 'Pendiente'],
    ['FECHA DE EMISIÓN', formatDateTime(new Date())],
  ];
  const cellW = W / cells.length;
  cells.forEach(([label, value], i) => {
    const x = L + i * cellW;
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.muted).text(label, x, top, { width: cellW - 10, characterSpacing: 1 });
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.text).text(value, x, top + 13, { width: cellW - 10 });
  });
  return top + 40;
}

function drawSettlement(doc: PDFKit.PDFDocument, payment: Payment, top: number): number {
  const pad = 14;
  let y = top;

  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted).text('LIQUIDACIÓN', L, y, { characterSpacing: 1.2 });
  y += 16;

  // Encabezado de la tabla
  doc.rect(L, y, W, 24).fill(C.header);
  doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted)
    .text('CONCEPTO', L + pad, y + 8.5, { characterSpacing: 0.8 })
    .text('VALOR', L, y + 8.5, { width: W - pad, align: 'right', characterSpacing: 0.8 });
  y += 24;

  const rows: [string, string, string?][] = [['Salario base', formatCurrency(payment.baseSalary)]];
  if (Number(payment.bonuses) > 0) rows.push(['Bonificaciones', formatCurrency(payment.bonuses)]);
  if (Number(payment.deductions) > 0) rows.push(['Deducciones', `- ${formatCurrency(payment.deductions)}`, C.danger]);

  for (const [label, value, color] of rows) {
    doc.font('Helvetica').fontSize(10).fillColor(C.body).text(label, L + pad, y + 9);
    doc.fillColor(color ?? C.text).text(value, L, y + 9, { width: W - pad, align: 'right' });
    y += 28;
    doc.moveTo(L, y).lineTo(R, y).lineWidth(0.75).strokeColor(C.border).stroke();
  }

  // Total
  doc.rect(L, y, W, 38).fill(C.accent);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff')
    .text('TOTAL PAGADO', L + pad, y + 14, { characterSpacing: 1 });
  doc.fontSize(16).text(formatCurrency(payment.totalAmount), L, y + 11, { width: W - pad, align: 'right' });
  y += 38;

  // Monto en letras
  doc.font('Helvetica-Oblique').fontSize(9).fillColor(C.muted)
    .text(`Son: ${amountInWords(payment.totalAmount)}`, L, y + 10, { width: W });
  return doc.y;
}

function drawNotes(doc: PDFKit.PDFDocument, notes: string, top: number): number {
  const pad = 12;
  const textW = W - pad * 2 - 3;
  doc.font('Helvetica').fontSize(9.5);
  const textH = doc.heightOfString(notes, { width: textW });
  const h = textH + 38;

  // Notas muy largas: sin recuadro (no cabría en la página) y el texto fluye a la siguiente
  if (top + h > PAGE.height - M - 20) {
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.muted).text('NOTAS', L, top, { characterSpacing: 1 });
    doc.font('Helvetica').fontSize(9.5).fillColor(C.body).text(notes, L, top + 14, { width: W });
    return doc.y;
  }

  doc.rect(L, top, W, h).fill(C.soft);
  doc.rect(L, top, 3, h).fill(C.border);
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.muted)
    .text('NOTAS', L + pad + 3, top + 11, { characterSpacing: 1 });
  doc.font('Helvetica').fontSize(9.5).fillColor(C.body)
    .text(notes, L + pad + 3, top + 25, { width: textW });
  return top + h;
}

function drawSignatures(doc: PDFKit.PDFDocument, payment: Payment, minTop: number): void {
  const blockH = 116;
  const footerTop = PAGE.height - M - 12;
  // Las firmas van al final de la página; si el contenido es largo, en una página nueva.
  let top = Math.max(minTop, footerTop - blockH - 20);
  if (top + blockH > footerTop) {
    doc.addPage();
    top = M + 20;
  }

  // Solo firma el trabajador (el responsable ya figura en su recuadro): bloque centrado
  const colW = 260;
  const leftX = L + (W - colW) / 2;
  const lineY = top + 60;

  // Firma del trabajador
  if (payment.digitalSignature) {
    try {
      const base64 = payment.digitalSignature.replace(/^data:image\/\w+;base64,/, '');
      doc.image(Buffer.from(base64, 'base64'), leftX + 10, top, { fit: [colW - 20, 54], align: 'center', valign: 'bottom' });
    } catch {
      doc.font('Helvetica-Oblique').fontSize(9).fillColor(C.muted)
        .text('Firmado digitalmente', leftX, lineY - 16, { width: colW, align: 'center' });
    }
  } else if (payment.signedDocumentUrl) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(C.muted)
      .text('Firmado en documento físico', leftX, lineY - 16, { width: colW, align: 'center' });
  }

  signatureLine(doc, leftX, lineY, colW, payment.employee.fullName, `Documento ${payment.employee.documentId}`, 'FIRMA DEL TRABAJADOR');
  if (payment.signedAt && payment.digitalSignature) {
    doc.font('Helvetica').fontSize(7.5).fillColor(C.subtle)
      .text(`Firmado digitalmente el ${formatDateTime(payment.signedAt)}`, leftX, lineY + 44, { width: colW, align: 'center' });
  }
}

function signatureLine(
  doc: PDFKit.PDFDocument, x: number, y: number, w: number,
  name: string, detail: string, caption: string,
): void {
  doc.moveTo(x, y).lineTo(x + w, y).lineWidth(0.75).strokeColor(C.text).stroke();
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.text).text(name, x, y + 7, { width: w, align: 'center' });
  let ny = y + 20;
  if (detail) {
    doc.font('Helvetica').fontSize(8.5).fillColor(C.muted).text(detail, x, ny, { width: w, align: 'center' });
    ny += 12;
  }
  doc.font('Helvetica-Bold').fontSize(7).fillColor(C.subtle).text(caption, x, ny, { width: w, align: 'center', characterSpacing: 1 });
}

function drawFooter(doc: PDFKit.PDFDocument, brand: string, ref: string): void {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // Sin margen inferior para que escribir en el pie no cree una página nueva
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const y = PAGE.height - M + 8;
    doc.moveTo(L, y - 8).lineTo(R, y - 8).lineWidth(0.5).strokeColor(C.border).stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor(C.subtle)
      .text(`Documento generado por ${brand} el ${formatDateTime(new Date())}`, L, y, { width: W * 0.65, lineBreak: false })
      .text(`Comprobante ${ref}  ·  Página ${i - range.start + 1} de ${range.count}`, L, y, { width: W, align: 'right', lineBreak: false });

    doc.page.margins.bottom = bottom;
  }
}
