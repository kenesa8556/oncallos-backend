import { Module } from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { CloudCredentialsModule } from '../cloud-credentials/cloud-credentials.module';
import { ExecutionModule } from '../execution/execution.module';
import { DiagnosisController } from './diagnosis.controller';
import { RailwayToolModule } from '../execution/tools/railway-tool.module';

@Module({
  imports: [SupabaseModule, AuthModule, CloudCredentialsModule, ExecutionModule, RailwayToolModule],
  controllers: [DiagnosisController],
  providers: [DiagnosisService],
  exports: [DiagnosisService],
})
export class DiagnosisModule {}