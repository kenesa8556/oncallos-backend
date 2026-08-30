import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}