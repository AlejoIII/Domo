import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createE2eApp, unwrapBody } from './helpers/e2e-app';
import { authHeader, registerTestUser } from './helpers/auth.helper';
import { PrismaService } from '../src/common/database/prisma.service';

describe('Document flow (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createE2eApp();
    const prisma = app.get(PrismaService);
    const user = await registerTestUser(app, prisma);
    token = user.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('converts quote → order → invoice and registers payment', async () => {
    const clientRes = await request(app.getHttpServer())
      .post('/api/v1/clients')
      .set(authHeader(token))
      .send({ name: 'Flow Client', email: 'flow@e2e.test' })
      .expect(201);

    const client = unwrapBody<{ id: string }>(clientRes.body);

    const quoteRes = await request(app.getHttpServer())
      .post('/api/v1/quotes')
      .set(authHeader(token))
      .send({
        clientId: client.id,
        status: 'sent',
        taxRate: 21,
        lines: [{ description: 'Servicio consultoría', quantity: 2, unitPrice: 50 }],
      })
      .expect(201);

    const quote = unwrapBody<{ id: string; total: number }>(quoteRes.body);
    expect(Number(quote.total)).toBeGreaterThan(0);

    const orderRes = await request(app.getHttpServer())
      .post(`/api/v1/quotes/${quote.id}/convert-to-order`)
      .set(authHeader(token))
      .expect(201);

    const order = unwrapBody<{ id: string; status: string }>(orderRes.body);
    expect(order.status).toBe('confirmed');

    const invoiceRes = await request(app.getHttpServer())
      .post(`/api/v1/orders/${order.id}/convert-to-invoice`)
      .set(authHeader(token))
      .expect(201);

    const invoice = unwrapBody<{ id: string; status: string; total: number }>(invoiceRes.body);
    expect(invoice.status).toBe('issued');

    const paymentRes = await request(app.getHttpServer())
      .post(`/api/v1/invoices/${invoice.id}/payments`)
      .set(authHeader(token))
      .send({ amount: Number(invoice.total) / 2, method: 'transfer' })
      .expect(201);

    const paidInvoice = unwrapBody<{ status: string; paidAmount: number }>(paymentRes.body);
    expect(paidInvoice.status).toBe('partially_paid');
    expect(paidInvoice.paidAmount).toBeGreaterThan(0);
  });

  it('issues a credit note that reduces the invoice balance', async () => {
    const clientRes = await request(app.getHttpServer())
      .post('/api/v1/clients')
      .set(authHeader(token))
      .send({ name: 'Credit Note Client' })
      .expect(201);

    const client = unwrapBody<{ id: string }>(clientRes.body);

    const invoiceRes = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set(authHeader(token))
      .send({
        clientId: client.id,
        status: 'issued',
        taxRate: 21,
        lines: [{ description: 'Producto defectuoso', quantity: 1, unitPrice: 100 }],
      })
      .expect(201);

    const invoice = unwrapBody<{ id: string; total: number }>(invoiceRes.body);
    expect(Number(invoice.total)).toBe(121);

    const creditNoteRes = await request(app.getHttpServer())
      .post(`/api/v1/invoices/${invoice.id}/credit-note`)
      .set(authHeader(token))
      .send({ reason: 'Devolución total de la mercancía' })
      .expect(201);

    const creditNote = unwrapBody<{
      id: string;
      number: string;
      documentType: string;
      status: string;
      total: number;
      originalInvoiceId: string;
    }>(creditNoteRes.body);

    expect(creditNote.documentType).toBe('credit_note');
    expect(creditNote.status).toBe('issued');
    expect(Number(creditNote.total)).toBe(121);
    expect(creditNote.originalInvoiceId).toBe(invoice.id);

    const refreshedRes = await request(app.getHttpServer())
      .get(`/api/v1/invoices/${invoice.id}`)
      .set(authHeader(token))
      .expect(200);

    const refreshed = unwrapBody<{
      status: string;
      creditedAmount: number;
      balanceDue: number;
      isFullyCredited: boolean;
    }>(refreshedRes.body);

    expect(refreshed.status).toBe('credited');
    expect(refreshed.creditedAmount).toBe(121);
    expect(refreshed.balanceDue).toBe(0);
    expect(refreshed.isFullyCredited).toBe(true);

    await request(app.getHttpServer())
      .post(`/api/v1/invoices/${invoice.id}/credit-note`)
      .set(authHeader(token))
      .send({ reason: 'Segunda rectificación no permitida' })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/v1/invoices/${creditNote.id}/payments`)
      .set(authHeader(token))
      .send({ amount: 10, method: 'transfer' })
      .expect(400);
  });

  it('returns a server-generated PDF for an invoice', async () => {
    const clientRes = await request(app.getHttpServer())
      .post('/api/v1/clients')
      .set(authHeader(token))
      .send({ name: 'PDF Client', taxId: 'B12345678' })
      .expect(201);

    const client = unwrapBody<{ id: string }>(clientRes.body);

    const invoiceRes = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set(authHeader(token))
      .send({
        clientId: client.id,
        status: 'issued',
        taxRate: 21,
        lines: [{ description: 'Servicio facturado', quantity: 1, unitPrice: 200 }],
      })
      .expect(201);

    const invoice = unwrapBody<{ id: string }>(invoiceRes.body);

    const pdfRes = await request(app.getHttpServer())
      .get(`/api/v1/invoices/${invoice.id}/pdf`)
      .set(authHeader(token))
      .expect(200);

    expect(pdfRes.headers['content-type']).toContain('application/pdf');
    expect(pdfRes.body.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
