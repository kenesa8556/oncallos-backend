import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { RiskRulesService } from './risk-rules.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('organizations/:orgId/risk-rules')
export class RiskRulesController {
  constructor(private readonly riskRulesService: RiskRulesService) {}

  @Get()
  async get(@Param('orgId') orgId: string) {
    return this.riskRulesService.get(orgId);
  }

  @Patch()
  async update(@Param('orgId') orgId: string, @Body('high_risk_keywords') keywords: string[]) {
    return this.riskRulesService.update(orgId, keywords);
  }
}