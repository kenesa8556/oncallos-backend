import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AgentService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getPendingActions(organizationId: string) {
    const { data, error } = await this.supabaseService.client
      .from('agent_actions')
      .select('id, incident_id, action_name, args, created_at')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async reportResult(organizationId: string, actionId: string, status: 'completed' | 'failed', result: any) {
    const { data: action, error: fetchError } = await this.supabaseService.client
      .from('agent_actions')
      .select('id, organization_id')
      .eq('id', actionId)
      .single();

    if (fetchError || !action) throw new NotFoundException('Agent action not found');
    if (action.organization_id !== organizationId) {
      throw new NotFoundException('Agent action not found'); // don't leak cross-org existence
    }

    const { error } = await this.supabaseService.client
      .from('agent_actions')
      .update({ status, result })
      .eq('id', actionId);

    if (error) throw error;
    return { success: true };
  }
}