import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Diagnosis } from '../diagnosis/diagnosis.types';
import { CloudCredentialsService } from '../cloud-credentials/cloud-credentials.service';
import { RailwayTool } from '../execution/tools/railway.tool';

@Injectable()
export class VerificationService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly cloudCredentialsService: CloudCredentialsService,
    private readonly railwayTool: RailwayTool,
  ) {}

  async verify(diagnosis: Diagnosis, incidentId: string): Promise<{ passed: boolean }> {
    if (diagnosis.toolName === 'none') {
      // No automatable action was ever taken, so there is nothing to
      // independently verify. Falling through to the generic health
      // check below would trivially "pass" (the service was never
      // touched, so it's healthy) and falsely mark a no-op incident as
      // resolved. Leave it open for a human to review instead.
      console.log('[VERIFICATION] toolName is "none" — no action was taken, skipping verification and leaving incident open.');
      return { passed: false };
    }

    const { data: incident } = await this.supabaseService.client
      .from('incidents')
      .select('organization_id, service_name')
      .eq('id', incidentId)
      .single();

    const organizationId = incident?.organization_id;
    let passed: boolean | null = null;

    if (organizationId) {
      try {
        const credentials = await this.cloudCredentialsService.getDecryptedCredentialsByName(
          organizationId,
          incident.service_name,
        );

        if (diagnosis.toolName === 'rollback_deployment') {
          // Railway's rollback creates a brand new deployment rather
          // than reviving the old deployment's ID, so we can't compare
          // IDs. Instead: confirm the current live deployment was
          // created AFTER we triggered the rollback, and that it
          // reached SUCCESS.
          const { data: snapshot } = await this.supabaseService.client
            .from('snapshots')
            .select('state_data, created_at')
            .eq('incident_id', incidentId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!snapshot) {
            console.log('[INDEPENDENT VERIFICATION] No rollback snapshot found — cannot verify');
            passed = false;
          } else {
            const current = await this.railwayTool.getCurrentDeployment(
              credentials.token,
              credentials.serviceId,
              credentials.environmentId,
            );
            const rolledBackAfterSnapshot = new Date(current.createdAt) > new Date(snapshot.created_at);
            console.log(`[INDEPENDENT VERIFICATION] Current live deployment: ${current.id}, status: ${current.status}, created ${current.createdAt} (rollback triggered ${snapshot.created_at})`);
            passed = rolledBackAfterSnapshot && current.status === 'SUCCESS';
          }
        } else if (diagnosis.toolName === 'clear_cache') {
          // No independent state to check — Railway exposes no
          // "cache state" query. This is a known limitation: we can
          // only trust the mutation's own success response here.
          console.log('[INDEPENDENT VERIFICATION] clear_cache has no independent check available — trusting agent_actions record');
          passed = null; // falls through to the agent_actions fallback below
        } else {
          // restart_service / scale_replicas: existing generic check
          const status = await this.railwayTool.getServiceStatus(
            credentials.token,
            credentials.serviceId,
            credentials.environmentId,
          );
          console.log(`[INDEPENDENT VERIFICATION] Real Railway service status: ${status}`);
          passed = status === 'SUCCESS';
        }
      } catch (err: any) {
        console.log(`[INDEPENDENT VERIFICATION] Could not check real status: ${err.message} — falling back to agent_actions record`);
      }
    }

    if (passed === null) {
      const { data: action } = await this.supabaseService.client
        .from('agent_actions')
        .select('status, result')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!action) {
        console.log('[VERIFICATION] No agent action found yet for this incident — treating as not passed.');
        return { passed: false };
      }
      passed = action.status === 'completed';
    }

    if (passed) {
      console.log('[VERIFICATION PASSED]');

      const { error } = await this.supabaseService.client.from('resolutions').insert({
        incident_id: incidentId,
        root_cause: diagnosis.rootCause,
        resolution_method: diagnosis.recommendedAction,
        resolved: true,
        resolved_at: new Date().toISOString(),
      });
      if (error) console.error('Failed to insert resolution:', error.message);

      await this.supabaseService.client
        .from('incidents')
        .update({ status: 'resolved' })
        .eq('id', incidentId);
    } else {
      console.log('[VERIFICATION FAILED] Real service status did not indicate success.');
      console.log('[ROLLBACK APPROVAL NEEDED] Awaiting human decision to roll back.');
    }

    return { passed };
  }
}