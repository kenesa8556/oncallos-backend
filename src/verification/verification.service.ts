import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { verifyAction } from './verification.types';
import { Diagnosis } from '../diagnosis/diagnosis.types';

@Injectable()
export class VerificationService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async verify(diagnosis: Diagnosis, incidentId: string): Promise<{ passed: boolean }> {
    const passed = verifyAction();

    if (passed) {
      console.log('[VERIFICATION PASSED] Action resolved the issue.');



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
      console.log('[VERIFICATION FAILED] Action did not resolve the issue.');
      console.log('[ROLLBACK APPROVAL NEEDED] Awaiting human decision to roll back.');
      // TODO: re-trigger diagnosis with updated context reflecting this failure
    }

    return { passed };
  }
}