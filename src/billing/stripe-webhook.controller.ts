import { Controller, Post, Req, Res, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { BillingService } from './billing.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(@Req() request: Request, @Res() response: Response) {
    const signature = request.headers['stripe-signature'] as string;

    console.log('Webhook secret in use:', process.env.STRIPE_WEBHOOK_SECRET);
  console.log('Body is Buffer?', Buffer.isBuffer(request.body));

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      return response.status(400).json({ error: 'Invalid signature' });
    }

    await this.billingService.handleWebhookEvent(event);
    return response.json({ received: true });
  }
}