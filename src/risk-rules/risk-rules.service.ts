import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const DEFAULT_HIGH_RISK_KEYWORDS = ['delete', 'drop', 'terminate', 'destroy', 'remove'];

@Injectable()
export class RiskRulesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async get(organizationId: string) {
    const { data, error } = await this.supabaseService.client
      .from('risk_rules')
      .select('high_risk_keywords, updated_at')
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      return { organization_id: organizationId, high_risk_keywords: DEFAULT_HIGH_RISK_KEYWORDS, updated_at: null };
    }

    return data;
  }

  async update(organizationId: string, keywords: string[]) {
    const { data, error } = await this.supabaseService.client
      .from('risk_rules')
      .upsert({
        organization_id: organizationId,
        high_risk_keywords: keywords,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}