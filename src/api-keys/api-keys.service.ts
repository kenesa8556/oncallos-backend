import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ApiKeysService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  }

  async create(organizationId: string, name: string) {
    const rawKey = `oc_${randomBytes(24).toString('hex')}`;
    const keyHash = this.hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 10);

    const { data, error } = await this.supabaseService.client
      .from('api_keys')
      .insert({
        organization_id: organizationId,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
      })
      .select('id, name, key_prefix, created_at')
      .single();

    if (error) throw error;

    // rawKey is only ever returned here, once — never stored, never shown again
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

    // fire-and-forget last_used_at update
    this.supabaseService.client
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id)
      .then(() => {});

    return data; // { id, organization_id }
  }
}