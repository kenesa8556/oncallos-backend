import { Module } from '@nestjs/common';
import { RiskRulesController } from './risk-rules.controller';
import { RiskRulesService } from './risk-rules.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [RiskRulesController],
  providers: [RiskRulesService],
})
export class RiskRulesModule {}