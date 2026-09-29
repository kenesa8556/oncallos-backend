import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

const API_KEY_LIMITS: Record<string, number> = { free: 1, pro: 3, ultra: 10, max: 50 };
const INCIDENT_LIMITS: Record<string, number | null> = { free: 25, pro: 500, ultra: 2000, max: null };

@Injectable()
export class ApiKeysService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  }

  async create(organizationId: string, name: string) {
    const { data: org } = await this.supabaseService.client
      .from('organizations')
      .select('plan')
      .eq('id', organizationId)
      .single();

    const plan = org?.plan ?? 'free';
    const limit = API_KEY_LIMITS[plan] ?? API_KEY_LIMITS.free;

    const { count } = await this.supabaseService.client
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if ((count ?? 0) >= limit) {
      throw new BadRequestException(`API key limit reached for plan "${plan}" (${limit} keys)`);
    }

    const rawKey = `oc_${randomBytes(24).toString('hex')}`;
    const keyHash = this.hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 10);

    const { data, error } = await this.supabaseService.client
      .from('api_keys')
      .insert({ organization_id: organizationId, name, key_hash: keyHash, key_prefix: keyPrefix })
      .select('id, name, key_prefix, created_at')
      .single();

    if (error) throw error;
    return { ...data, rawKey };
  }

  async list(organizationId: string) {
    const { data, error } = await this.supabaseService.client
      .from('api_keys')
      .select('id, name, key_prefix, last_used_at, created_at')
      .eq('organization_id', organizationId);

    if (error) throw error;
    return data;
  }

  async revoke(organizationId: string, keyId: string) {
    const { error } = await this.supabaseService.client
      .from('api_keys')
      .delete()
      .eq('organization_id', organizationId)
      .eq('id', keyId);

    if (error) throw error;
    return { success: true };
  }

  async validateKey(rawKey: string) {
    const keyHash = this.hashKey(rawKey);

    const { data, error } = await this.supabaseService.client
      .from('api_keys')
      .select('id, organization_id')
      .eq('key_hash', keyHash)
      .single();

    if (error || !data) throw new NotFoundException('Invalid API key');

    this.supabaseService.client
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id)
      .then(() => {});

    return data;
  }

  async checkIncidentLimit(organizationId: string) {
    const { data: org } = await this.supabaseService.client
      .from('organizations')
      .select('plan')
      .eq('id', organizationId)
      .single();

    const plan = org?.plan ?? 'free';
    const limit = INCIDENT_LIMITS[plan];
    if (limit === null || limit === undefined) return; // unlimited

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await this.supabaseService.client
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', startOfMonth.toISOString());

    if ((count ?? 0) >= limit) {
      throw new BadRequestException(
        `Monthly incident limit reached for plan "${plan}" (${limit}/month). Upgrade to process more incidents.`,
      );
    }
  }

  async getUsage(organizationId: string) {
    const { data: org } = await this.supabaseService.client
      .from('organizations')
      .select('plan')
      .eq('id', organizationId)
      .single();

    const plan = org?.plan ?? 'free';

    const { count: keyCount } = await this.supabaseService.client
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: incidentCount } = await this.supabaseService.client
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', startOfMonth.toISOString());

    return {
      plan,
      apiKeys: { used: keyCount ?? 0, limit: API_KEY_LIMITS[plan] ?? API_KEY_LIMITS.free },
      incidentsThisMonth: { used: incidentCount ?? 0, limit: INCIDENT_LIMITS[plan] },
    };
  }
}