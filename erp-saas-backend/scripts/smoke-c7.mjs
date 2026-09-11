#!/usr/bin/env node
/**
 * Smoke test automatizado — Fase C7 (API)
 * Uso: npm run smoke:c7
 */
import 'dotenv/config';

const BASE = process.env.API_URL ?? 'http://localhost:3000/api/v1';
const ts = Date.now();
const email = `c7-${ts}@test.local`;

const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  let json;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { res, json, data: json?.data ?? json };
}

function unwrapAuth(data) {
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  };
}

console.log('=== Smoke test C7 ===\n');

// 0. Health
{
  const { res } = await api('/health');
  if (res.ok) pass('Backend health');
  else fail('Backend health', `HTTP ${res.status}`);
}

// 1. Registro → plan Free
let token;
let companyId;
{
  const { res, data } = await api('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyName: `C7 Test ${ts}`,
      firstName: 'C7',
      lastName: 'Tester',
      email,
      password: 'test123456',
    }),
  });
  const auth = unwrapAuth(data);
  token = auth.accessToken;
  companyId = auth.user?.companyId;
  if (res.ok && token && companyId) {
    pass('Registro nueva empresa', email);
  } else {
    fail('Registro nueva empresa', JSON.stringify(data));
    printSummary();
    process.exit(1);
  }
}

const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

// 2. Usage → plan Free
{
  const { res, data } = await api('/billing/usage', { headers: authHeader });
  if (res.ok && data.plan?.code === 'free') {
    pass('Plan Free tras registro', `${data.plan.name}, max ${data.plan.maxUsers} users`);
  } else {
    fail('Plan Free tras registro', data.plan?.code ?? res.status);
  }
}

// 3. Onboarding flag
{
  const { res, data } = await api('/settings/onboarding', { headers: authHeader });
  if (res.ok && data.onboardingCompleted === false) {
    pass('Onboarding pendiente');
  } else {
    fail('Onboarding pendiente');
  }

  const patch = await api('/settings/onboarding', {
    method: 'PATCH',
    headers: authHeader,
    body: JSON.stringify({ completed: true }),
  });
  if (patch.res.ok && patch.data.onboardingCompleted === true) {
    pass('Completar onboarding');
  } else {
    fail('Completar onboarding');
  }
}

// 4. Límite usuarios Free (3)
{
  const roles = await api('/roles', { headers: authHeader });
  const roleId = roles.data?.[0]?.id;

  for (let i = 1; i <= 2; i++) {
    const inv = await api('/settings/invitations', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ email: `inv${i}-${ts}@test.local`, roleId }),
    });
    if (!inv.res.ok) {
      fail(`Invitación ${i}/2`, JSON.stringify(inv.data));
      break;
    }
    if (i === 2) pass('2 invitaciones en plan Free (1 admin + 2 pendientes = 3)');
  }

  const blocked = await api('/settings/invitations', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({ email: `inv3-${ts}@test.local`, roleId }),
  });
  const code = blocked.json?.data?.code ?? blocked.json?.code;
  if (blocked.res.status === 403 && code === 'PLAN_LIMIT_USERS') {
    pass('Bloqueo 4.º usuario en Free', 'PLAN_LIMIT_USERS');
  } else {
    fail('Bloqueo 4.º usuario en Free', `status=${blocked.res.status} code=${code}`);
  }
}

// 5. Stripe habilitado
{
  const { res, data } = await api('/billing/status', { headers: authHeader });
  if (res.ok && data.stripeEnabled) {
    pass('Stripe habilitado');
  } else {
    fail('Stripe habilitado', 'Configura STRIPE_SECRET_KEY');
  }
}

// 6. Webhook firmado (requiere STRIPE_WEBHOOK_SECRET y backend reiniciado)
{
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    fail('Webhook local', 'Falta STRIPE_WEBHOOK_SECRET');
  } else {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_x');
    const priceId = process.env.STRIPE_PRICE_PRO ?? 'price_test';
    const event = {
      id: `evt_c7_${ts}`,
      object: 'event',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: `sub_c7_${ts}`,
          object: 'subscription',
          customer: `cus_c7_${ts}`,
          status: 'active',
          trial_end: null,
          metadata: { companyId, planCode: 'pro' },
          items: { data: [{ price: { id: priceId } }] },
        },
      },
    };
    const payload = JSON.stringify(event);
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
    const wh = await fetch(`${BASE}/billing/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
      body: payload,
    });
    if (!wh.ok) {
      fail('Webhook checkout/subscription', await wh.text());
    } else {
      pass('Webhook subscription.updated');
      const usage = await api('/billing/usage', { headers: authHeader });
      if (usage.data.plan?.code === 'pro') {
        pass('Plan actualizado a Pro vía webhook');
      } else {
        fail('Plan actualizado a Pro vía webhook', usage.data.plan?.code);
      }
    }
  }
}

// 7. Storage driver
{
  const driver = process.env.STORAGE_DRIVER ?? 'local';
  pass('Storage configurado', `STORAGE_DRIVER=${driver}`);
  if (driver === 's3') {
    console.log('  → Verifica upload manual en UI (paso manual C7)');
  } else {
    console.log('  → S3: opcional; cambia STORAGE_DRIVER=s3 en .env para probar');
  }
}

function printSummary() {
  const ok = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n=== ${ok}/${total} pasos OK ===`);
}

printSummary();
const failed = results.some((r) => !r.ok);
process.exit(failed ? 1 : 0);
