import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createE2eApp, unwrapBody } from './helpers/e2e-app';
import { authHeader, registerTestUser } from './helpers/auth.helper';
import { PrismaService } from '../src/common/database/prisma.service';

describe('Clients (e2e)', () => {
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

  it('creates, lists, updates and deletes a client', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/clients')
      .set(authHeader(token))
      .send({ name: 'Cliente E2E', email: 'cliente@e2e.test', city: 'Madrid' })
      .expect(201);

    const created = unwrapBody<{ id: string; name: string }>(createRes.body);
    expect(created.name).toBe('Cliente E2E');

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/clients')
      .set(authHeader(token))
      .expect(200);

    const list = unwrapBody<{ items: { id: string }[] }>(listRes.body);
    expect(list.items.some((c) => c.id === created.id)).toBe(true);

    await request(app.getHttpServer())
      .patch(`/api/v1/clients/${created.id}`)
      .set(authHeader(token))
      .send({ city: 'Barcelona' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/v1/clients/${created.id}`)
      .set(authHeader(token))
      .expect(200);
  });
});
