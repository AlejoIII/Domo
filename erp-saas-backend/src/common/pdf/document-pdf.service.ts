import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  PDF_DOCUMENT_TITLES,
  PdfDocumentData,
  PdfDocumentLine,
  PdfParty,
} from './document-pdf.types';

const PAGE_MARGIN = 48;
const COLOR_TEXT = '#111827';
const COLOR_MUTED = '#6b7280';
const COLOR_BRAND = '#4f46e5';
const COLOR_LINE = '#e5e7eb';

const COLUMNS = {
  description: { x: PAGE_MARGIN, width: 250 },
  quantity: { x: PAGE_MARGIN + 258, width: 60 },
  unitPrice: { x: PAGE_MARGIN + 326, width: 80 },
  lineTotal: { x: PAGE_MARGIN + 414, width: 85 },
};

/** Genera el PDF de facturas, rectificativas y presupuestos sin dependencias de navegador. */
@Injectable()
export class DocumentPdfService {
  render(data: PdfDocumentData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: PAGE_MARGIN,
        // Necesario para poder recorrer las páginas y estampar la marca de agua al final
        bufferPages: true,
        info: {
          Title: `${PDF_DOCUMENT_TITLES[data.kind]} ${data.number}`,
          Author: data.issuer.name,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this.drawHeader(doc, data);
        this.drawParties(doc, data);
        const endY = this.drawLines(doc, data);
        this.drawTotals(doc, data, endY);
        this.drawFooter(doc, data);
        if (data.watermark) this.drawWatermark(doc, data.watermark);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  buildFileName(data: PdfDocumentData): string {
    const slug = data.number.replace(/[^a-zA-Z0-9-_]/g, '-');
    return `${PDF_DOCUMENT_TITLES[data.kind].toLowerCase().replace(/ /g, '-')}-${slug}.pdf`;
  }

  private drawHeader(doc: PDFKit.PDFDocument, data: PdfDocumentData) {
    doc.fillColor(COLOR_BRAND).fontSize(20).font('Helvetica-Bold')
      .text(PDF_DOCUMENT_TITLES[data.kind], PAGE_MARGIN, PAGE_MARGIN);

    doc.fillColor(COLOR_TEXT).fontSize(11).font('Helvetica-Bold')
      .text(data.number, PAGE_MARGIN, doc.y + 2);

    const metaX = 360;
    doc.fontSize(9).font('Helvetica').fillColor(COLOR_MUTED);
    doc.text(`Fecha: ${this.formatDate(data.issueDate)}`, metaX, PAGE_MARGIN, {
      width: 160,
      align: 'right',
    });
    if (data.dueDate) {
      doc.text(`Vencimiento: ${this.formatDate(data.dueDate)}`, metaX, doc.y, {
        width: 160,
        align: 'right',
      });
    }
    if (data.originalNumber) {
      doc.text(`Rectifica a: ${data.originalNumber}`, metaX, doc.y, {
        width: 160,
        align: 'right',
      });
    }

    doc.moveTo(PAGE_MARGIN, 108).lineTo(547, 108).strokeColor(COLOR_LINE).stroke();
  }

  private drawParties(doc: PDFKit.PDFDocument, data: PdfDocumentData) {
    const top = 124;
    const recipientLabel = data.kind === 'quote' ? 'Cliente' : 'Destinatario';

    this.drawParty(doc, 'Emisor', data.issuer, PAGE_MARGIN, top);
    this.drawParty(doc, recipientLabel, data.recipient, 310, top);

    const blockEnd = Math.max(doc.y, top + 88);
    doc.y = blockEnd + 12;
  }

  private drawParty(
    doc: PDFKit.PDFDocument,
    label: string,
    party: PdfParty,
    x: number,
    y: number,
  ) {
    doc.fontSize(8).font('Helvetica-Bold').fillColor(COLOR_MUTED)
      .text(label.toUpperCase(), x, y, { width: 230 });

    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLOR_TEXT)
      .text(party.name, x, doc.y + 2, { width: 230 });

    const details = [
      party.taxId ? `NIF: ${party.taxId}` : null,
      party.address,
      [party.postalCode, party.city].filter(Boolean).join(' '),
      party.country,
      party.email,
      party.phone,
    ].filter((value): value is string => !!value && value.trim().length > 0);

    doc.fontSize(9).font('Helvetica').fillColor(COLOR_MUTED);
    for (const line of details) {
      doc.text(line, x, doc.y, { width: 230 });
    }
  }

  private drawTableHeader(doc: PDFKit.PDFDocument, y: number): number {
    doc.rect(PAGE_MARGIN, y, 499, 20).fill('#f3f4f6');
    doc.fillColor(COLOR_MUTED).fontSize(9).font('Helvetica-Bold');
    doc.text('Descripción', COLUMNS.description.x + 6, y + 6, { width: COLUMNS.description.width });
    doc.text('Cant.', COLUMNS.quantity.x, y + 6, { width: COLUMNS.quantity.width, align: 'right' });
    doc.text('Precio', COLUMNS.unitPrice.x, y + 6, { width: COLUMNS.unitPrice.width, align: 'right' });
    doc.text('Total', COLUMNS.lineTotal.x, y + 6, { width: COLUMNS.lineTotal.width, align: 'right' });
    doc.font('Helvetica').fillColor(COLOR_TEXT).fontSize(9);
    return y + 26;
  }

  private drawLines(doc: PDFKit.PDFDocument, data: PdfDocumentData): number {
    let y = this.drawTableHeader(doc, doc.y);

    for (const line of data.lines) {
      const height = this.lineHeight(doc, line);
      if (y + height > 720) {
        doc.addPage();
        y = this.drawTableHeader(doc, PAGE_MARGIN);
      }

      doc.fillColor(COLOR_TEXT).font('Helvetica')
        .text(line.description, COLUMNS.description.x + 6, y, {
          width: COLUMNS.description.width,
        });
      doc.text(this.formatNumber(line.quantity), COLUMNS.quantity.x, y, {
        width: COLUMNS.quantity.width,
        align: 'right',
      });
      doc.text(this.formatMoney(line.unitPrice, data.currency), COLUMNS.unitPrice.x, y, {
        width: COLUMNS.unitPrice.width,
        align: 'right',
      });
      doc.text(this.formatMoney(line.lineTotal, data.currency), COLUMNS.lineTotal.x, y, {
        width: COLUMNS.lineTotal.width,
        align: 'right',
      });

      y += height;
      doc.moveTo(PAGE_MARGIN, y - 4).lineTo(547, y - 4).strokeColor(COLOR_LINE).stroke();
    }

    return y;
  }

  private lineHeight(doc: PDFKit.PDFDocument, line: PdfDocumentLine): number {
    const textHeight = doc.heightOfString(line.description, {
      width: COLUMNS.description.width,
    });
    return Math.max(textHeight, 12) + 10;
  }

  private drawTotals(doc: PDFKit.PDFDocument, data: PdfDocumentData, startY: number) {
    let y = startY + 8;
    if (y > 660) {
      doc.addPage();
      y = PAGE_MARGIN;
    }

    const labelX = 330;
    const valueX = COLUMNS.lineTotal.x;
    const rows: Array<{ label: string; value: string; bold?: boolean }> = [
      { label: 'Base imponible', value: this.formatMoney(data.subtotal, data.currency) },
      {
        label: `IVA (${this.formatNumber(data.taxRate)} %)`,
        value: this.formatMoney(data.taxAmount, data.currency),
      },
      { label: 'Total', value: this.formatMoney(data.total, data.currency), bold: true },
    ];

    if (data.kind !== 'quote' && data.paidAmount !== undefined) {
      rows.push({ label: 'Cobrado', value: this.formatMoney(data.paidAmount, data.currency) });
    }
    if (data.kind !== 'quote' && data.balanceDue !== undefined) {
      rows.push({
        label: 'Pendiente',
        value: this.formatMoney(data.balanceDue, data.currency),
        bold: true,
      });
    }

    for (const row of rows) {
      doc.fontSize(row.bold ? 11 : 9)
        .font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(row.bold ? COLOR_TEXT : COLOR_MUTED);
      doc.text(row.label, labelX, y, { width: 130, align: 'right' });
      doc.fillColor(COLOR_TEXT)
        .text(row.value, valueX, y, { width: COLUMNS.lineTotal.width, align: 'right' });
      y += row.bold ? 18 : 14;
    }

    doc.y = y + 8;
  }

  private drawFooter(doc: PDFKit.PDFDocument, data: PdfDocumentData) {
    if (data.creditReason) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor(COLOR_TEXT)
        .text('Motivo de la rectificación', PAGE_MARGIN, doc.y + 6, { width: 499 });
      doc.font('Helvetica').fillColor(COLOR_MUTED)
        .text(data.creditReason, PAGE_MARGIN, doc.y + 2, { width: 499 });
    }

    if (data.notes) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor(COLOR_TEXT)
        .text('Observaciones', PAGE_MARGIN, doc.y + 8, { width: 499 });
      doc.font('Helvetica').fillColor(COLOR_MUTED)
        .text(data.notes, PAGE_MARGIN, doc.y + 2, { width: 499 });
    }

    if (data.kind === 'credit_note') {
      doc.fontSize(8).font('Helvetica').fillColor(COLOR_MUTED)
        .text(
          'Documento emitido como factura rectificativa conforme al art. 15 del Reglamento de facturación (RD 1619/2012).',
          PAGE_MARGIN,
          doc.y + 10,
          { width: 499 },
        );
    }
  }

  private drawWatermark(doc: PDFKit.PDFDocument, text: string) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      doc.save();
      doc.rotate(-30, { origin: [297, 420] });
      doc.fontSize(28).font('Helvetica-Bold').fillColor('#9ca3af').opacity(0.18)
        .text(text, 60, 400, { width: 480, align: 'center' });
      doc.opacity(1);
      doc.restore();
    }
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(value);
  }

  private formatMoney(value: number, currency: string): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(value);
  }
}
