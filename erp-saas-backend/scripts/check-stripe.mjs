import 'dotenv/config';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();
const priceId = process.env.STRIPE_PRICE_PRO;

try {
  const account = await stripe.accounts.retrieve();
  console.log('account:', account.id);
} catch (e) {
  console.log('account_err:', e.message);
}

try {
  const prices = await stripe.prices.list({ limit: 10, active: true, expand: ['data.product'] });
  console.log('account_prices:', prices.data.map((p) => ({
    id: p.id,
    amount: p.unit_amount,
    currency: p.currency,
    product: typeof p.product === 'object' ? p.product.name : p.product,
  })));
} catch (e) {
  console.log('list_prices_err:', e.message);
}

const plans = await prisma.plan.findMany({ select: { code: true, stripePriceId: true } });
console.log('db_plans:', JSON.stringify(plans));

await prisma.$disconnect();
