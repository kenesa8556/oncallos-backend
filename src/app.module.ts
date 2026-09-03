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
import { IncidentsModule} from './incidents/incidents.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { MembersModule } from './members/members.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AgentModule } from './agent/agent.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { RiskRulesModule } from './risk-rules/risk-rules.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    AuthModule,
    AlertsModule,
    AgentModule,
    BillingModule,
    OrganizationsModule,
    EmbeddingsModule,
    ContextModule,
    DiagnosisModule,
    ExecutionModule,
    MembersModule,
    ApiKeysModule,
    RiskRulesModule,
    WebhooksModule,
    SnapshotsModule,
    VerificationModule,
    IncidentsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}