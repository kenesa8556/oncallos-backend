import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { CloudCredentialsModule } from '../cloud-credentials/cloud-credentials.module';
import { ExecutionModule } from '../execution/execution.module';
import { RailwayToolModule } from '../execution/tools/railway-tool.module';

@Module({
  imports: [SupabaseModule, CloudCredentialsModule, ExecutionModule, RailwayToolModule],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}