import { Injectable } from '@nestjs/common';
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
}