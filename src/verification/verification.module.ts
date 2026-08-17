import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}