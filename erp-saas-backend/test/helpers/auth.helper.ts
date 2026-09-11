import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/common/database/prisma.service';
import { unwrapBody } from './e2e-app';

const FLOW_PERMISSIONS = [
  'clients.read',
  'clients.write',
  'products.read',
  'products.write',
  'orders.read',
  'orders.write',
  'invoices.read',
  'invoices.write',
  'quotes.read',
  'quotes.write',
];

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}

export async function grantPermissions(
  prisma: PrismaService,
  roleId: string,
  permissionNames: string[],
) {
  const permissions = await Promise.all(
    permissionNames.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name, description: name },
      }),
    ),
  );

  await prisma.rolePermission.createMany({
    data: permissions.map((p) => ({ roleId, permissionId: p.id })),
    skipDuplicates: true,
  });
}

export async function registerTestUser(app: INestApplication, prisma: PrismaService) {
  const email = uniqueEmail('e2e');
  const password = 'test123456';

  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({
      companyName: 'E2E Test Co',
      firstName: 'E2E',
      lastName: 'Tester',
      email,
      password,
    });

  expect([200, 201]).toContain(res.status);

  const payload = unwrapBody<{
    accessToken: string;
    user: { id: string; companyId: string; roleId: string | null };
  }>(res.body);

  if (payload.user.roleId) {
    await grantPermissions(prisma, payload.user.roleId, FLOW_PERMISSIONS);
  }

  await ensureDefaultWarehouse(prisma, payload.user.companyId);

  return {
    email,
    password,
    token: payload.accessToken,
    userId: payload.user.id,
    companyId: payload.user.companyId,
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function ensureDefaultWarehouse(prisma: PrismaService, companyId: string) {
  const existing = await prisma.warehouse.findFirst({
    where: { companyId, deletedAt: null, isActive: true },
  });
  if (existing) {
    await prisma.company.update({
      where: { id: companyId },
      data: { defaultWarehouseId: existing.id },
    });
    return existing.id;
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      companyId,
      code: 'E2E',
      name: 'Almacén E2E',
      isActive: true,
    },
  });

  await prisma.company.update({
    where: { id: companyId },
    data: { defaultWarehouseId: warehouse.id },
  });

  return warehouse.id;
}
