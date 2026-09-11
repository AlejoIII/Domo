import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../common/database/prisma.service';
import { isValidStripePriceId, isValidStripeSecretKey } from './stripe.config';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe | null;
  private readonly webhookSecret: string | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    this.stripe = isValidStripeSecretKey(secretKey) ? new Stripe(secretKey!) : null;
  }

  isEnabled() {
    return !!this.stripe;
  }

  private client() {
    if (!this.stripe) {
      throw new BadRequestException('Stripe no está configurado en este entorno');
    }
    return this.stripe;
  }

  private frontendUrl() {
    return this.config.get('FRONTEND_URL', 'http://localhost:5173').replace(/\/$/, '');
  }

  private handleStripeError(err: unknown, fallback: string): never {
    if (err instanceof Stripe.errors.StripeError) {
      this.logger.warn(`Stripe error: ${err.message}`);
      throw new BadRequestException(err.message || fallback);
    }
    throw err;
  }

  async createCheckoutSession(params: {
    companyId: string;
    planCode: string;
    customerEmail: string;
  }) {
    const stripe = this.client();
    const plan = await this.prisma.plan.findUnique({ where: { code: params.planCode } });
    if (!plan?.stripePriceId || !isValidStripePriceId(plan.stripePriceId)) {
      throw new BadRequestException('Este plan no está disponible para compra online');
    }

    const company = await this.prisma.company.findFirst({
      where: { id: params.companyId, deletedAt: null },
    });
    if (!company) throw new BadRequestException('Empresa no encontrada');

    try {
      let customerId = company.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: params.customerEmail,
          name: company.name,
          metadata: { companyId: params.companyId },
        });
        customerId = customer.id;
        await this.prisma.company.update({
          where: { id: params.companyId },
          data: { stripeCustomerId: customerId },
        });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        success_url: `${this.frontendUrl()}/settings?tab=billing&billing=success`,
        cancel_url: `${this.frontendUrl()}/settings?tab=billing&billing=cancel`,
        metadata: {
          companyId: params.companyId,
          planCode: params.planCode,
        },
        subscription_data: {
          metadata: {
            companyId: params.companyId,
            planCode: params.planCode,
          },
        },
      });

      if (!session.url) {
        throw new InternalServerErrorException('No se pudo crear la sesión de pago');
      }

      return { url: session.url };
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof InternalServerErrorException) {
        throw err;
      }
      this.handleStripeError(err, 'No se pudo iniciar el pago con Stripe');
    }
  }

  async syncSubscriptionForCompany(companyId: string) {
    const stripe = this.client();
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
    });
    if (!company) throw new BadRequestException('Empresa no encontrada');

    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const customers = await stripe.customers.search({
        query: `metadata['companyId']:'${companyId}'`,
        limit: 1,
      });
      if (customers.data[0]) {
        customerId = customers.data[0].id;
        await this.prisma.company.update({
          where: { id: companyId },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    if (!customerId) {
      return { synced: false, reason: 'no_customer' as const };
    }

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });

    const subscription = subs.data.find((s) =>
      ['active', 'trialing', 'past_due'].includes(s.status),
    ) ?? subs.data[0];

    if (!subscription) {
      return { synced: false, reason: 'no_subscription' as const };
    }

    await this.syncSubscription(subscription, companyId);
    return {
      synced: true,
      subscriptionStatus: subscription.status,
    };
  }

  async createPortalSession(companyId: string) {
    const stripe = this.client();
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
    });
    if (!company?.stripeCustomerId) {
      throw new BadRequestException('No hay suscripción de Stripe asociada a tu empresa');
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: company.stripeCustomerId,
        return_url: `${this.frontendUrl()}/settings?tab=billing`,
      });

      return { url: session.url };
    } catch (err) {
      this.handleStripeError(err, 'No se pudo abrir el portal de Stripe');
    }
  }

  async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    if (!this.stripe || !this.webhookSecret) {
      throw new BadRequestException('Webhooks de Stripe no configurados');
    }
    if (!rawBody || !signature) {
      throw new BadRequestException('Petición de webhook inválida');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err) {
      this.logger.warn(`Webhook signature failed: ${(err as Error).message}`);
      throw new BadRequestException('Firma de webhook inválida');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session) {
    const companyId = session.metadata?.companyId;
    if (!companyId || session.mode !== 'subscription') return;

    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        stripeCustomerId:
          typeof session.customer === 'string' ? session.customer : session.customer?.id,
        stripeSubscriptionId: subscriptionId ?? undefined,
      },
    });

    if (subscriptionId) {
      const subscription = await this.client().subscriptions.retrieve(subscriptionId);
      await this.syncSubscription(subscription);
    }
  }

  private async syncSubscription(subscription: Stripe.Subscription, companyIdOverride?: string) {
    const companyId = companyIdOverride ?? subscription.metadata?.companyId;
    if (!companyId) return;

    const priceId = subscription.items.data[0]?.price.id;
    const plan = priceId
      ? await this.prisma.plan.findFirst({ where: { stripePriceId: priceId } })
      : null;

    const planCode = subscription.metadata?.planCode;
    const planByCode = !plan && planCode
      ? await this.prisma.plan.findUnique({ where: { code: planCode } })
      : null;

    const resolvedPlan = plan ?? planByCode;

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        stripeCustomerId:
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        trialEndsAt: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
        ...(resolvedPlan ? { planId: resolvedPlan.id } : {}),
      },
    });
  }

  private async onSubscriptionDeleted(subscription: Stripe.Subscription) {
    const companyId = subscription.metadata?.companyId;
    if (!companyId) return;

    const freePlan = await this.prisma.plan.findUnique({ where: { code: 'free' } });

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        stripeSubscriptionId: null,
        subscriptionStatus: 'canceled',
        planId: freePlan?.id ?? null,
        trialEndsAt: null,
      },
    });
  }
}
