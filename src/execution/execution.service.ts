import { Injectable } from '@nestjs/common';
import { Diagnosis } from '../diagnosis/diagnosis.types';
import { classifyRisk, needsSnapshot } from './execution.types';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CloudCredentialsService } from '../cloud-credentials/cloud-credentials.service';
import { RailwayTool } from './tools/railway.tool';

const DEFAULT_HIGH_RISK_KEYWORDS = ['delete', 'drop', 'terminate', 'destroy', 'remove'];

@Injectable()
export class ExecutionService {
  constructor(
    private readonly snapshotsService: SnapshotsService,
    private readonly supabaseService: SupabaseService,
    private readonly cloudCredentialsService: CloudCredentialsService,
    private readonly railwayTool: RailwayTool,
  ) {}

  private async getHighRiskKeywords(organizationId: string | null): Promise<string[]> {
    if (!organizationId) return DEFAULT_HIGH_RISK_KEYWORDS;

    const { data, error } = await this.supabaseService.client
      .from('risk_rules')
      .select('high_risk_keywords')
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) return DEFAULT_HIGH_RISK_KEYWORDS;
    return data.high_risk_keywords;
  }

  async runTool(diagnosis: Diagnosis, organizationId: string, incidentId: string | null): Promise<{ ranReal: boolean; detail: string }> {
    if (diagnosis.toolName === 'none' || !diagnosis.toolArgs) {
      return { ranReal: false, detail: 'No automatable tool for this action' };
    }

    let credentials;
    try {
      credentials = await this.cloudCredentialsService.getDecryptedCredentialsByName(
        organizationId,
        diagnosis.toolArgs.service,
      );
    } catch {
      return { ranReal: false, detail: 'No execution credentials configured — action logged only' };
    }

    if (diagnosis.toolName === 'restart_service') {
      try {
        const currentDeployment = await this.railwayTool.getCurrentDeployment(
          credentials.token,
          credentials.serviceId,
          credentials.environmentId,
        );

        const { error: snapshotError } = await this.supabaseService.client.from('snapshots').insert({
          incident_id: incidentId,
          organization_id: organizationId,
          state_data: {
            provider: 'railway',
            service: diagnosis.toolArgs.service,
            deploymentId: currentDeployment.id,
            status: currentDeployment.status,
            capturedAt: currentDeployment.createdAt,
          },
        });

        if (snapshotError) {
          console.error('[SNAPSHOT INSERT FAILED]', snapshotError.message);
        }

        const result = await this.railwayTool.restartService(
          credentials.token,
          credentials.serviceId,
          credentials.environmentId,
        );
        return { ranReal: true, detail: `Real Railway redeploy triggered: ${JSON.stringify(result)}` };
      } catch (err: any) {
        return { ranReal: false, detail: `Railway execution failed: ${err.message}` };
      }
    }

    if (diagnosis.toolName === 'scale_replicas') {
      try {
        const result = await this.railwayTool.scaleReplicas(
          credentials.token,
          credentials.serviceId,
          credentials.environmentId,
          diagnosis.toolArgs.numReplicas ?? 3,
        );
        return { ranReal: true, detail: `Real Railway scale-up triggered: ${JSON.stringify(result)}` };
      } catch (err: any) {
        return { ranReal: false, detail: `Railway scaling failed: ${err.message}` };
      }
    }

    if (diagnosis.toolName === 'rollback_deployment') {
      try {
        const target = await this.railwayTool.findRollbackTarget(
          credentials.token,
          credentials.serviceId,
          credentials.environmentId,
        );

        const { error: snapshotError } = await this.supabaseService.client.from('snapshots').insert({
          incident_id: incidentId,
          organization_id: organizationId,
          state_data: {
            provider: 'railway',
            service: diagnosis.toolArgs.service,
            deploymentId: target.id,
            status: target.status,
            capturedAt: new Date().toISOString(),
          },
        });

        if (snapshotError) {
          console.error('[SNAPSHOT INSERT FAILED]', snapshotError.message);
        }

        const result = await this.railwayTool.rollbackToDeployment(credentials.token, target.id);
        return { ranReal: true, detail: `Real Railway rollback to deployment ${target.id}: ${JSON.stringify(result)}` };
      } catch (err: any) {
        return { ranReal: false, detail: `Railway rollback failed: ${err.message}` };
      }
    }

    if (diagnosis.toolName === 'clear_cache') {
      try {
        const result = await this.railwayTool.clearCache(
          credentials.token,
          credentials.serviceId,
          credentials.environmentId,
        );
        return { ranReal: true, detail: `Real Railway cache purge triggered: ${JSON.stringify(result)}` };
      } catch (err: any) {
        return { ranReal: false, detail: `Railway cache purge failed: ${err.message}` };
      }
    }

    return { ranReal: false, detail: `Unknown tool: ${diagnosis.toolName}` };
  }

  async execute(
    diagnosis: Diagnosis,
    serviceName: string,
    incidentId: string | null = null,
    organizationId: string | null = null,
  ): Promise<{ status: string; message: string }> {
    const highRiskKeywords = await this.getHighRiskKeywords(organizationId);
    const risk = classifyRisk(diagnosis.recommendedAction, highRiskKeywords);

    if (risk === 'low') {
      if (needsSnapshot(diagnosis.recommendedAction)) {
        await this.snapshotsService.createSnapshot(incidentId, serviceName, diagnosis);
      }

      const toolResult = organizationId
        ? await this.runTool(diagnosis, organizationId, incidentId)
        : { ranReal: false, detail: 'No organization context' };

      const { error } = await this.supabaseService.client.from('agent_actions').insert({
        organization_id: organizationId,
        incident_id: incidentId,
        action_name: diagnosis.recommendedAction,
        args: { service: serviceName, tool: diagnosis.toolName, ranReal: toolResult.ranReal },
        status: toolResult.ranReal ? 'completed' : 'pending',
        result: toolResult.ranReal ? { detail: toolResult.detail } : null,
      });

      if (error) {
        console.error('Failed to record agent action:', error.message);
        return { status: 'failed', message: 'Could not record action' };
      }

      console.log(toolResult.ranReal ? `[REAL EXECUTION] ${toolResult.detail}` : `[QUEUED FOR AGENT] ${toolResult.detail}`);

      return {
        status: 'auto_executed',
        message: toolResult.ranReal
          ? `Real action executed: ${toolResult.detail}`
          : `Low-risk action queued for agent execution: ${diagnosis.recommendedAction}`,
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

  async rollback(incidentId: string, organizationId: string) {
    const { data: snapshot } = await this.supabaseService.client
      .from('snapshots')
      .select('*')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!snapshot || snapshot.state_data?.provider !== 'railway') {
      throw new Error('No real, restorable snapshot found for this incident');
    }

    const credentials = await this.cloudCredentialsService.getDecryptedCredentialsByName(
      organizationId,
      snapshot.state_data.service,
    );

    const result = await this.railwayTool.rollbackToDeployment(
      credentials.token,
      snapshot.state_data.deploymentId,
    );

    console.log(`[REAL ROLLBACK] Restored ${snapshot.state_data.service} to deployment ${snapshot.state_data.deploymentId}: ${JSON.stringify(result)}`);
    return result;
  }
}