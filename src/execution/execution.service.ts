import { Injectable } from '@nestjs/common';
import { Diagnosis } from '../diagnosis/diagnosis.types';
import { classifyRisk, needsSnapshot } from './execution.types';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ExecutionService {
  constructor(
    private readonly snapshotsService: SnapshotsService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async execute(
    diagnosis: Diagnosis,
    serviceName: string,
    incidentId: string | null = null,
    organizationId: string | null = null,
  ): Promise<{ status: string; message: string }> {
    const risk = classifyRisk(diagnosis.recommendedAction);

    if (risk === 'low') {
      if (needsSnapshot(diagnosis.recommendedAction)) {
        await this.snapshotsService.createSnapshot(incidentId, serviceName, diagnosis);
      }

      const { error } = await this.supabaseService.client
        .from('agent_actions')
        .insert({
          organization_id: organizationId,
          incident_id: incidentId,
          action_name: diagnosis.recommendedAction,
          args: { service: serviceName },
          status: 'pending',
        });

      if (error) {
        console.error('Failed to queue agent action:', error.message);
        return { status: 'failed', message: 'Could not queue action for agent execution' };
      }

      console.log(`[QUEUED FOR AGENT] Action queued: ${diagnosis.recommendedAction}`);
      return {
        status: 'auto_executed',
        message: `Low-risk action queued for agent execution: ${diagnosis.recommendedAction}`,
      };
    }

    console.log(
      `[SIMULATED SLACK ALERT] High-risk action requires approval:\n` +
      `Root cause: ${diagnosis.rootCause}\n` +
      `Recommended action: ${diagnosis.recommendedAction}\n` +
      `Confidence: ${diagnosis.confidence}\n` +
      `--> Awaiting human approval before executing.`,
    );

    return {
      status: 'pending',
      message: `High-risk action flagged for approval: ${diagnosis.recommendedAction}`,
    };
  }
}