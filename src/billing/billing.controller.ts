import { Controller, Post, Param, UseGuards, Req } from '@nestjs/common';
import { BillingService } from './billing.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(SupabaseAuthGuard)
@Controller('organizations/:orgId/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('subscribe')
  async subscribe(@Param('orgId') orgId: string, @CurrentUser() user) {
    return this.billingService.createSubscription(orgId, user.id, user.email);
  }

  @Post('portal')
  async portal(@Param('orgId') orgId: string, @CurrentUser() user) {
    return this.billingService.createPortalSession(orgId, user.id);
  }
}