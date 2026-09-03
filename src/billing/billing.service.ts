import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { SupabaseService } from '../supabase/supabase.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

@Injectable()
export class BillingService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createSubscription(organizationId: string, userId: string, userEmail: string) {
    const { data: membership } = await this.supabaseService.client
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'owner') {
      throw new ForbiddenException('Only the org owner can manage billing');
    }

    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { organizationId },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRO_PRICE_ID! }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.confirmation_secret'],
      metadata: { organizationId },
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const clientSecret = (invoice as any).confirmation_secret?.client_secret;
    if (!clientSecret) {
      throw new Error('No client secret returned from invoice');
    }

    return { clientSecret, subscriptionId: subscription.id };
  }

  async createPortalSession(organizationId: string, userId: string) {
    const { data: membership } = await this.supabaseService.client
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'owner') {
      throw new ForbiddenException('Only the org owner can manage billing');
    }

    // Find the Stripe customer via metadata (avoids trusting a client-supplied customerId)
    const customers = await stripe.customers.search({
      query: `metadata['organizationId']:'${organizationId}'`,
    });

    const customer = customers.data[0];
    if (!customer) {
      throw new NotFoundException('No Stripe customer found for this organization');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: process.env.FRONTEND_URL ?? 'http://localhost:3000/settings/billing',
    });

    return { url: session.url };
  }

  async handleWebhookEvent(event: Stripe.Event) {
    if (event.type === 'invoice.payment_succeeded' || event.type === 'customer.subscription.updated') {
      const object = event.data.object as any;
      const organizationId = object.metadata?.organizationId ?? object.subscription_details?.metadata?.organizationId;

      if (!organizationId) {
        console.warn(`Webhook ${event.type} had no organizationId in metadata — skipping`);
        return;
      }

      await this.supabaseService.client
        .from('organizations')
        .update({ plan: 'pro' })
        .eq('id', organizationId);

      console.log(`[BILLING] Organization ${organizationId} upgraded to pro`);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = subscription.metadata?.organizationId;

      if (organizationId) {
        await this.supabaseService.client
          .from('organizations')
          .update({ plan: 'free' })
          .eq('id', organizationId);

        console.log(`[BILLING] Organization ${organizationId} downgraded to free`);
      }
    }
  }
}