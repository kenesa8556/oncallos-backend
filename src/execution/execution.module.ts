import { Module } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [ExecutionService, SnapshotsService],
  exports: [ExecutionService],
})
export class ExecutionModule {}