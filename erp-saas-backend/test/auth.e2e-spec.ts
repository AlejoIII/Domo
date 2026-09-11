import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { generateSync } from 'otplib';
import { createE2eApp, unwrapBody } from './helpers/e2e-app';
import { authHeader, registerTestUser } from './helpers/auth.helper';
import { PrismaService } from '../src/common/database/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers and logs in a user', async () => {
    const prisma = app.get(PrismaService);
    const user = await registerTestUser(app, prisma);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password });

    expect([200, 201]).toContain(loginRes.status);

    const login = unwrapBody<{ accessToken: string; refreshToken: string }>(loginRes.body);
    expect(login.accessToken).toBeTruthy();
    expect(login.refreshToken).toBeTruthy();

    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set(authHeader(login.accessToken));

    expect([200, 201]).toContain(meRes.status);

    const me = unwrapBody<{ email: string }>(meRes.body);
    expect(me.email).toBe(user.email);
  });

  it('rotates refresh tokens and rejects the old one', async () => {
    const prisma = app.get(PrismaService);
    const user = await registerTestUser(app, prisma);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password });

    const login = unwrapBody<{ accessToken: string; refreshToken: string }>(loginRes.body);

    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.refreshToken });

    expect([200, 201]).toContain(refreshRes.status);

    const refreshed = unwrapBody<{ accessToken: string; refreshToken: string }>(refreshRes.body);
    expect(refreshed.accessToken).toBeTruthy();
    expect(refreshed.refreshToken).not.toBe(login.refreshToken);

    const oldRefreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.refreshToken });

    expect(oldRefreshRes.status).toBe(401);
  });

  it('logout revokes the refresh token', async () => {
    const prisma = app.get(PrismaService);
    const user = await registerTestUser(app, prisma);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password });

    const login = unwrapBody<{ accessToken: string; refreshToken: string }>(loginRes.body);

    const logoutRes = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set(authHeader(login.accessToken))
      .send({ refreshToken: login.refreshToken });

    expect([200, 201]).toContain(logoutRes.status);

    const refreshRes = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.refreshToken });

    expect(refreshRes.status).toBe(401);
  });

  it('locks account after repeated failed login attempts', async () => {
    const prisma = app.get(PrismaService);
    const user = await registerTestUser(app, prisma);
    const maxAttempts = Number(process.env.ACCOUNT_LOCKOUT_MAX_ATTEMPTS ?? '5');

    for (let i = 0; i < maxAttempts; i += 1) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'wrong-password' });
      expect(res.status).toBe(401);
    }

    const lockedRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'wrong-password' });

    expect(lockedRes.status).toBe(429);

    const validRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password });

    expect(validRes.status).toBe(429);
  });

  it('requires TOTP for admins with 2FA enabled', async () => {
    const prisma = app.get(PrismaService);
    const user = await registerTestUser(app, prisma);

    const setupRes = await request(app.getHttpServer())
      .post('/api/v1/auth/2fa/setup')
      .set(authHeader(user.token));

    expect([200, 201]).toContain(setupRes.status);
    const setup = unwrapBody<{ secret: string }>(setupRes.body);

    const code = generateSync({ secret: setup.secret });
    const enableRes = await request(app.getHttpServer())
      .post('/api/v1/auth/2fa/enable')
      .set(authHeader(user.token))
      .send({ code });

    expect([200, 201]).toContain(enableRes.status);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password });

    expect([200, 201]).toContain(loginRes.status);
    const login = unwrapBody<{ requiresTotp: boolean; tempToken: string }>(loginRes.body);
    expect(login.requiresTotp).toBe(true);
    expect(login.tempToken).toBeTruthy();

    const verifyCode = generateSync({ secret: setup.secret });
    const verifyRes = await request(app.getHttpServer())
      .post('/api/v1/auth/2fa/verify-login')
      .send({ tempToken: login.tempToken, code: verifyCode });

    expect([200, 201]).toContain(verifyRes.status);
    const session = unwrapBody<{ accessToken: string; refreshToken: string }>(verifyRes.body);
    expect(session.accessToken).toBeTruthy();
    expect(session.refreshToken).toBeTruthy();
  });

  it('resets password via email token flow', async () => {
    const prisma = app.get(PrismaService);
    const user = await registerTestUser(app, prisma);

    const forgotRes = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .send({ email: user.email });

    expect([200, 201]).toContain(forgotRes.status);
    const forgot = unwrapBody<{ devResetUrl?: string }>(forgotRes.body);

    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
      select: { passwordResetToken: true },
    });
    expect(dbUser?.passwordResetToken).toBeTruthy();

    const token = dbUser!.passwordResetToken!;
    const newPassword = 'newpass123456';

    const resetRes = await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .send({ token, password: newPassword });

    expect([200, 201]).toContain(resetRes.status);

    const oldLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: newPassword });
    expect([200, 201]).toContain(newLogin.status);

    if (forgot.devResetUrl) {
      expect(forgot.devResetUrl).toContain(token);
    }
  });
});
