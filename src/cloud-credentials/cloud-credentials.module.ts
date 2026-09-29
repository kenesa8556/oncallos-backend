import { Module } from '@nestjs/common';
import { CloudCredentialsController } from './cloud-credentials.controller';
import { CloudCredentialsService } from './cloud-credentials.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { RailwayToolModule } from '../execution/tools/railway-tool.module';

@Module({
  imports: [SupabaseModule, AuthModule, RailwayToolModule],
  controllers: [CloudCredentialsController],
  providers: [CloudCredentialsService],
  exports: [CloudCredentialsService],
})
export class CloudCredentialsModule {}