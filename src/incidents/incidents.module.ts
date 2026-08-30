import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [IncidentsController],
})
export class IncidentsModule {}