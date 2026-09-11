import 'dotenv/config';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

const companies = await prisma.company.findMany({
  where: { deletedAt: null },
  select: {
    id: true,
    name: true,
    stripeCustomerId: true,
    stripeSubscriptionId: true,
    subscriptionStatus: true,
    plan: { select: { code: true, name: true } },
  },
});
console.log('companies:', JSON.stringify(companies, null, 2));

for (const c of companies.filter((x) => x.stripeCustomerId)) {
  const subs = await stripe.subscriptions.list({ customer: c.stripeCustomerId, limit: 5 });
  console.log(`stripe subs for ${c.name}:`, subs.data.map((s) => ({
    id: s.id,
    status: s.status,
    price: s.items.data[0]?.price.id,
    metadata: s.metadata,
  })));
}

await prisma.$disconnect();
