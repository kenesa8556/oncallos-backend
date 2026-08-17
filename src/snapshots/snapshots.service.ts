import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Diagnosis } from '../diagnosis/diagnosis.types';

interface SnapshotState {
  serviceName: string;
  action: {
    name: string;
    reason: string;
  };
  diagnosis: {
    rootCause: string;
    confidence: string;
    recommendedAction: string;
  };
  // TODO: Capture real service version, replicas, configuration,
  // health status, etc. from the infrastructure provider.
}

@Injectable()
export class SnapshotsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createSnapshot(
    incidentId: string | null,
    serviceName: string,
    diagnosis: Diagnosis,
  ): Promise<string | null> {
    const stateData: SnapshotState = {
      serviceName,
      action: {
        name: 'recommended_action',
        reason: diagnosis.recommendedAction,
      },
      diagnosis: {
        rootCause: diagnosis.rootCause,
        confidence: diagnosis.confidence,
        recommendedAction: diagnosis.recommendedAction,
      },
    };

    const { data, error } = await this.supabaseService.client
      .from('snapshots')
      .insert({
        incident_id: incidentId,
        state_data: stateData,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create snapshot:', error.message);
      return null;
    }

    console.log('[SNAPSHOT CREATED]', data.id, stateData);
    return data.id;
  }

  async rollback(snapshotId: string): Promise<{ success: boolean; message: string }> {
    const { data: snapshot, error } = await this.supabaseService.client
      .from('snapshots')
      .select('*')
      .eq('id', snapshotId)
      .single();

    if (error || !snapshot) {
      return { success: false, message: 'Snapshot not found' };
    }

    // Simulated — no real infrastructure to actually revert yet
    console.log(
      `[SIMULATED ROLLBACK] Reverting to snapshot ${snapshotId}:`,
      JSON.stringify(snapshot.state_data, null, 2),
    );

    return {
      success: true,
      message: `Simulated rollback to snapshot ${snapshotId} complete.`,
    };
  }
}