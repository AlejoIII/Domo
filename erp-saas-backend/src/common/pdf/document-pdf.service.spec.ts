import { DocumentPdfService } from './document-pdf.service';
import { PdfDocumentData } from './document-pdf.types';

function buildData(overrides: Partial<PdfDocumentData> = {}): PdfDocumentData {
  return {
    kind: 'invoice',
    number: 'FAC-20260726-0001',
    issueDate: new Date('2026-07-26'),
    dueDate: new Date('2026-08-25'),
    status: 'issued',
    currency: 'EUR',
    subtotal: 100,
    taxRate: 21,
    taxAmount: 21,
    total: 121,
    paidAmount: 21,
    balanceDue: 100,
    lines: [
      { description: 'Servicio de consultoría', quantity: 2, unitPrice: 50, lineTotal: 100 },
    ],
    issuer: { name: 'Mi Empresa SL', taxId: 'B12345678', city: 'Madrid' },
    recipient: { name: 'Cliente SA', taxId: 'A87654321', city: 'Barcelona' },
    ...overrides,
  };
}

describe('DocumentPdfService', () => {
  const service = new DocumentPdfService();

  it('renders an invoice as a PDF buffer', async () => {
    const buffer = await service.render(buildData());

    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('renders a credit note with reason and original number', async () => {
    const buffer = await service.render(buildData({
      kind: 'credit_note',
      number: 'REC-20260726-0001',
      creditReason: 'Devolución parcial de mercancía',
      originalNumber: 'FAC-20260726-0001',
      paidAmount: undefined,
      balanceDue: undefined,
    }));

    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('renders a watermark without failing', async () => {
    const buffer = await service.render(buildData({
      watermark: 'Generado con Domo Free — domo.app',
    }));

    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('paginates documents with many lines', async () => {
    const lines = Array.from({ length: 60 }, (_, i) => ({
      description: `Línea de detalle número ${i + 1}`,
      quantity: 1,
      unitPrice: 10,
      lineTotal: 10,
    }));

    const buffer = await service.render(buildData({ lines }));

    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('builds a filename from the document kind and number', () => {
    expect(service.buildFileName(buildData())).toBe('factura-FAC-20260726-0001.pdf');
    expect(
      service.buildFileName(buildData({ kind: 'credit_note', number: 'REC-1' })),
    ).toBe('factura-rectificativa-REC-1.pdf');
  });
});
