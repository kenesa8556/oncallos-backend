import { Module } from '@nestjs/common';
import { IncidentChatController } from './incident-chat.controller';
import { IncidentChatService } from './incident-chat.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [IncidentChatController],
  providers: [IncidentChatService],
})
export class IncidentChatModule {}