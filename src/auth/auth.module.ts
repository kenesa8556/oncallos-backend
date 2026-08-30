import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [SupabaseAuthGuard],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}