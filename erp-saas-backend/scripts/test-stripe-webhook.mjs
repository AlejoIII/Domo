#!/usr/bin/env node
/**
 * Simula un webhook Stripe firmado en local (sin Stripe CLI).
 * Requiere STRIPE_WEBHOOK_SECRET en .env y backend reiniciado.
 *
 * Uso: node scripts/test-stripe-webhook.mjs [companyId]
 */
import 'dotenv/config';
import Stripe from 'stripe';

const baseUrl = process.env.API_URL ?? 'http://localhost:3000/api/v1';
const secret = process.env.STRIPE_WEBHOOK_SECRET;
const priceId = process.env.STRIPE_PRICE_PRO;

if (!secret) {
  console.error('Falta STRIPE_WEBHOOK_SECRET en .env');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder');

const companyId = process.argv[2];
if (!companyId) {
  console.error('Uso: node scripts/test-stripe-webhook.mjs <companyId>');
  process.exit(1);
}

const subscriptionId = `sub_test_${Date.now()}`;
const customerId = `cus_test_${Date.now()}`;

const event = {
  id: `evt_test_${Date.now()}`,
  object: 'event',
  type: 'customer.subscription.updated',
  data: {
    object: {
      id: subscriptionId,
      object: 'subscription',
      customer: customerId,
      status: 'active',
      trial_end: null,
      metadata: { companyId, planCode: 'pro' },
      items: {
        data: [{
          price: { id: priceId ?? 'price_test' },
        }],
      },
    },
  },
};

const payload = JSON.stringify(event);
const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });

const res = await fetch(`${baseUrl}/billing/webhook`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'stripe-signature': signature,
  },
  body: payload,
});

const body = await res.text();
console.log('webhook status:', res.status);
console.log(body);

if (!res.ok) process.exit(1);

console.log('OK — revisa que la empresa tenga plan Pro en GET /billing/usage');
