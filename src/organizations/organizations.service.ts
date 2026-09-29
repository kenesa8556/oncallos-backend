import { Injectable, ForbiddenException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(name: string, ownerId: string) {
    const { data: org, error: orgError } = await this.supabaseService.client
      .from('organizations')
      .insert({ name })
      .select()
      .single();

    if (orgError) throw orgError;

    const { error: memberError } = await this.supabaseService.client
      .from('organization_members')
      .insert({ organization_id: org.id, user_id: ownerId, role: 'owner' });

    if (memberError) throw memberError;

    return org;
  }

  async update(organizationId: string, userId: string, name: string) {
    const { data: membership } = await this.supabaseService.client
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'owner') {
      throw new ForbiddenException('Only the org owner can edit organization settings');
    }

    const { data, error } = await this.supabaseService.client
      .from('organizations')
      .update({ name })
      .eq('id', organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getOrCreateDatadogWebhookSecret(organizationId: string): Promise<string> {
    const { data: org, error } = await this.supabaseService.client
      .from('organizations')
      .select('datadog_webhook_secret')
      .eq('id', organizationId)
      .single();

    if (error) throw error;

    if (org.datadog_webhook_secret) {
      return org.datadog_webhook_secret;
    }

    const newSecret = randomBytes(24).toString('hex');
    const { error: updateError } = await this.supabaseService.client
      .from('organizations')
      .update({ datadog_webhook_secret: newSecret })
      .eq('id', organizationId);

    if (updateError) throw updateError;
    return newSecret;
  }

  async regenerateDatadogWebhookSecret(organizationId: string, userId: string): Promise<string> {
    const { data: membership } = await this.supabaseService.client
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'owner') {
      throw new ForbiddenException('Only the org owner can regenerate the webhook secret');
    }

    const newSecret = randomBytes(24).toString('hex');
    const { error } = await this.supabaseService.client
      .from('organizations')
      .update({ datadog_webhook_secret: newSecret })
      .eq('id', organizationId);

    if (error) throw error;
    return newSecret;
  }
}