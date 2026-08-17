import { Module } from '@nestjs/common';
import { ContextBuilderService } from './context-builder.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [SupabaseModule, EmbeddingsModule],
  providers: [ContextBuilderService],
  exports: [ContextBuilderService],
})
export class ContextModule {}