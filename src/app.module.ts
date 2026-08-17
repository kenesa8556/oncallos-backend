import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AlertsModule } from './alerts/alerts.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { ContextModule } from './context/context.module';
import { DiagnosisModule} from './diagnosis/diagnosis.module'
import { ExecutionModule} from './execution/execution.module'
import { SnapshotsModule} from './snapshots/snapshots.module';
import { VerificationModule} from './verification/verification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AlertsModule,
    EmbeddingsModule,
    ContextModule,
    DiagnosisModule,
    ExecutionModule,
    SnapshotsModule,
    VerificationModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}