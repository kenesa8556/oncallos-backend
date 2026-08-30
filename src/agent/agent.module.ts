import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [SupabaseModule, ApiKeysModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}