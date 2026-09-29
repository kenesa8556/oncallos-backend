import { Module } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { CloudCredentialsModule } from '../cloud-credentials/cloud-credentials.module';
import { RailwayToolModule } from './tools/railway-tool.module';

@Module({
  imports: [SupabaseModule, CloudCredentialsModule, RailwayToolModule],
  providers: [ExecutionService, SnapshotsService],
  exports: [ExecutionService],
})
export class ExecutionModule {}