import 'dotenv/config';
import { delay, Worker } from 'bullmq';
import Redis from 'ioredis';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ContextBuilderService } from '../context/context-builder.service';
import { DiagnosisService } from '../diagnosis/diagnosis.service';
import { SupabaseService } from '../supabase/supabase.service';
import { ExecutionService } from '../execution/execution.service';
import { EmbeddingsService} from '../embeddings/embeddings.service';
import { verificationQueue } from '../verification/verification.queue';


const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

async function createNotification(supabaseService: any, organizationId: string, incidentId: string, type: string, message: string) {
  await supabaseService.client.from('notifications').insert({
    organization_id: organizationId,
    incident_id: incidentId,
    type,
    message,
  });
}

async function startWorker() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const contextBuilder = app.get(ContextBuilderService);
  const diagnosisService = app.get(DiagnosisService);
  const supabaseService = app.get(SupabaseService);
  const executionService = app.get(ExecutionService);
  const embeddingsService = app.get(EmbeddingsService);

  const worker = new Worker(
    'alerts',
    async (job) => {
      console.log('Processing alert:', job.data);
      const rawAlert = job.data;

const { data: incident, error } = await supabaseService.client
  .from('incidents')
      .insert({
      title: rawAlert.title,
      severity: rawAlert.severity,
      status: 'open',
      organization_id: rawAlert.organizationId,
      service_name: rawAlert.service,
    })
  .select()
  .single();

if (error) {
  console.error('Failed to create incident:', error.message);
  return;
}

console.log('[INCIDENT CREATED]', incident.id);

  await createNotification(supabaseService, rawAlert.organizationId, incident.id, 'new_incident', `New incident: ${incident.title}`);

const embedding = await embeddingsService.generateEmbedding(incident.title);
await supabaseService.client
  .from('incidents')
  .update({ embedding })
  .eq('id', incident.id);

      const context = await contextBuilder.buildContext(rawAlert, incident.id);
      console.log('Assembled IncidentContext:', JSON.stringify(context, null, 2));

      const diagnosis = await diagnosisService.diagnose(context);

      if (!diagnosis) {
        console.error('Diagnosis failed or returned invalid shape.');
        return;
      }

      console.log('Diagnosis:', diagnosis);


      // Persist the diagnosis
      const { error: diagnosisError } = await app.get(SupabaseService).client
            .from('diagnoses')
            .insert({
              incident_id: incident.id,
              root_cause: diagnosis.rootCause,
              confidence: diagnosis.confidence,
              recommended_action: diagnosis.recommendedAction,
              tool_name: diagnosis.toolName,
              tool_args: diagnosis.toolArgs,
              status: 'pending',
            });

      if (diagnosisError) {
        console.error('Failed to save diagnosis:', diagnosisError.message);
      } else {
        console.log('[DIAGNOSIS SAVED]', incident.id);
      }

     const outcome = await executionService.execute(diagnosis, rawAlert.service, incident.id, rawAlert.organizationId);

        console.log('Execution outcome:', outcome);
          if (outcome.status === 'pending') {
    await createNotification(supabaseService, rawAlert.organizationId, incident.id, 'needs_approval', `Approval needed: ${diagnosis.recommendedAction}`);
  }

        await app.get(SupabaseService).client
            .from('diagnoses')
            .update({ status: outcome.status })
            .eq('incident_id', incident.id);

            if (outcome.status === 'auto_executed') {
                await verificationQueue.add(
                  'verify-action',
                  {
                    alert: rawAlert,
                    diagnosis,
                    incident: incident.id,
                    delay : 10000
                  },
                  { delay: 10000 }, // 10 seconds for testing; would be minutes in real production
                );
                console.log('[VERIFICATION SCHEDULED] Will check in 10 seconds');
              }

      // Note: this requires the alert to already correspond to a real
      // incident row. For today's test, we'll just log the diagnosis
      // without storing it, unless job.data includes a real incident id.
      // TODO: once alerts create real incident rows, store diagnosis here:
      // await supabaseService.client.from('diagnoses').insert({
      //   incident_id: <real incident id>,
      //   root_cause: diagnosis.rootCause,
      //   confidence: diagnosis.confidence,
      //   recommended_action: diagnosis.recommendedAction,
      // });
    },
    { connection },
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });
}

startWorker();