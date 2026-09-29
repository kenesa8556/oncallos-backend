import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { ExecutionModule } from '../execution/execution.module';

@Module({
  imports: [SupabaseModule, AuthModule, ExecutionModule],
  controllers: [IncidentsController],
})
export class IncidentsModule {}