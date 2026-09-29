import { Controller, Post, Param, UseGuards, Req, Body } from '@nestjs/common';
import { BillingService } from './billing.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(SupabaseAuthGuard)
@Controller('organizations/:orgId/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  

  @Post('portal')
  async portal(@Param('orgId') orgId: string, @CurrentUser() user) {
    return this.billingService.createPortalSession(orgId, user.id);
  }

  @Post('subscribe')
  async subscribe(@Param('orgId') orgId: string, @Body('plan') plan: string, @CurrentUser() user) {
  return this.billingService.createSubscription(orgId, user.id, user.email, plan);
}
}