import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async list(organizationId: string) {
    const { data, error } = await this.supabaseService.client
      .from('notifications')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    return data;
  }

  async markRead(organizationId: string, id: string) {
    const { error } = await this.supabaseService.client
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return { success: true };
  }

  async markAllRead(organizationId: string) {
    const { error } = await this.supabaseService.client
      .from('notifications')
      .update({ read: true })
      .eq('organization_id', organizationId)
      .eq('read', false);

    if (error) throw error;
    return { success: true };
  }
}