import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createE2eApp, unwrapBody } from './helpers/e2e-app';
import { authHeader, grantPermissions, registerTestUser } from './helpers/auth.helper';
import { PrismaService } from '../src/common/database/prisma.service';

describe('Billing (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerAdminBillingUser() {
    const prisma = app.get(PrismaService);
    const user = await registerTestUser(app, prisma);

    const dbUser = await prisma.user.findFirst({
      where: { id: user.userId },
      include: { role: true },
    });

    if (dbUser?.roleId) {
      await grantPermissions(prisma, dbUser.roleId, [
        'settings.read',
        'settings.billing',
        'reports.read',
      ]);
    }

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password });

    const login = unwrapBody<{ accessToken: string }>(loginRes.body);

    return {
      ...user,
      token: login.accessToken,
    };
  }

  it('returns demo plan switch enabled in development', async () => {
    const user = await registerAdminBillingUser();

    const res = await request(app.getHttpServer())
      .get('/api/v1/billing/status')
      .set(authHeader(user.token));

    expect([200, 201]).toContain(res.status);
    const status = unwrapBody<{ demoPlanSwitchEnabled: boolean }>(res.body);
    expect(status.demoPlanSwitchEnabled).toBe(true);
  });

  it('switches demo plan and updates usage', async () => {
    const user = await registerAdminBillingUser();

    const switchRes = await request(app.getHttpServer())
      .patch('/api/v1/billing/demo-plan')
      .set(authHeader(user.token))
      .send({ planCode: 'free' });

    expect([200, 201]).toContain(switchRes.status);
    const switched = unwrapBody<{ planCode: string; usage: { plan: { code: string } } }>(
      switchRes.body,
    );
    expect(switched.planCode).toBe('free');
    expect(switched.usage.plan.code).toBe('free');

    const usageRes = await request(app.getHttpServer())
      .get('/api/v1/billing/usage')
      .set(authHeader(user.token));

    const usage = unwrapBody<{ plan: { code: string; features: Record<string, boolean> } }>(
      usageRes.body,
    );
    expect(usage.plan.code).toBe('free');
    expect(usage.plan.features.ads).toBe(true);
  });

  it('blocks premium reports on free plan', async () => {
    const user = await registerAdminBillingUser();

    await request(app.getHttpServer())
      .patch('/api/v1/billing/demo-plan')
      .set(authHeader(user.token))
      .send({ planCode: 'free' });

    const reportsRes = await request(app.getHttpServer())
      .get('/api/v1/reports/sales')
      .set(authHeader(user.token));

    expect(reportsRes.status).toBe(403);
    const body = unwrapBody<{ code: string; feature?: string }>(reportsRes.body);
    expect(body.code).toBe('PLAN_FEATURE_LOCKED');
    expect(body.feature).toBe('reports');
  });

  it('returns print branding for free plan', async () => {
    const user = await registerAdminBillingUser();

    await request(app.getHttpServer())
      .patch('/api/v1/billing/demo-plan')
      .set(authHeader(user.token))
      .send({ planCode: 'free' });

    const brandingRes = await request(app.getHttpServer())
      .get('/api/v1/billing/print-branding')
      .set(authHeader(user.token));

    expect([200, 201]).toContain(brandingRes.status);
    const branding = unwrapBody<{
      pdfWatermark: boolean;
      watermarkText: string | null;
    }>(brandingRes.body);
    expect(branding.pdfWatermark).toBe(true);
    expect(branding.watermarkText).toContain('Domo Free');
  });
});
