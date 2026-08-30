import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Diagnosis } from '../diagnosis/diagnosis.types';

@Injectable()
export class VerificationService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async verify(diagnosis: Diagnosis, incidentId: string): Promise<{ passed: boolean }> {
    // Look up the real agent_actions row for this incident instead of
    // randomly simulating pass/fail.
    const { data: action, error: actionError } = await this.supabaseService.client
      .from('agent_actions')
      .select('status, result')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (actionError || !action) {
      console.log('[VERIFICATION] No agent action found yet for this incident — treating as not passed.');
      return { passed: false };
    }

    const passed = action.status === 'completed';

    if (passed) {
      console.log('[VERIFICATION PASSED] Agent confirmed action completed.', action.result);

      const { error } = await this.supabaseService.client.from('resolutions').insert({
        incident_id: incidentId,
        root_cause: diagnosis.rootCause,
        resolution_method: diagnosis.recommendedAction,
        resolved: true,
        resolved_at: new Date().toISOString(),
      });
      if (error) {
        console.error('Failed to insert resolution:', error.message);
      } else {
        console.log('[RESOLUTION SAVED]', incidentId);
      }

      await this.supabaseService.client
        .from('incidents')
        .update({ status: 'resolved' })
        .eq('id', incidentId);
    } else {
      console.log(`[VERIFICATION FAILED] Agent action status: ${action.status}`);
      console.log('[ROLLBACK APPROVAL NEEDED] Awaiting human decision to roll back.');
      // TODO: re-trigger diagnosis with updated context reflecting this failure
    }

    return { passed };
  }
}