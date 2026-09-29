import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const SEAT_LIMITS: Record<string, number> = {
  free: 1,
  pro: 6,
  ultra: 20,
  max: 100,
};

@Injectable()
export class MembersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async list(organizationId: string) {
    const { data, error } = await this.supabaseService.client
      .from('organization_members')
      .select('id, user_id, role, created_at')
      .eq('organization_id', organizationId);

    if (error) throw error;
    return data;
  }

  async listWithEmails(organizationId: string) {
  const { data: members, error } = await this.supabaseService.client
    .from('organization_members')
    .select('id, user_id, role, created_at')
    .eq('organization_id', organizationId);

  if (error) throw error;

  const { data: userList, error: userError } = await this.supabaseService.client.auth.admin.listUsers();
  if (userError) throw userError;

  const emailByUserId = new Map(userList.users.map((u) => [u.id, u.email]));

  return members.map((m) => ({
    ...m,
    email: emailByUserId.get(m.user_id) ?? 'unknown',
  }));
}

  async addByEmail(organizationId: string, email: string) {
    // 1. Find the org's plan and current member count
    const { data: org, error: orgError } = await this.supabaseService.client
      .from('organizations')
      .select('plan')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) throw new NotFoundException('Organization not found');

    const { count, error: countError } = await this.supabaseService.client
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (countError) throw countError;

    const limit = SEAT_LIMITS[org.plan] ?? SEAT_LIMITS.free;
    if ((count ?? 0) >= limit) {
      throw new BadRequestException(`Seat limit reached for plan "${org.plan}" (${limit} seats)`);
    }

    // 2. Find the user by email (requires they already have an account)
    const { data: userList, error: userError } =
      await this.supabaseService.client.auth.admin.listUsers();

    if (userError) throw userError;

    const targetUser = userList.users.find((u) => u.email === email);
    if (!targetUser) {
      throw new NotFoundException('No account found with that email — they must sign up first');
    }

    // 3. Insert membership
    const { data, error } = await this.supabaseService.client
      .from('organization_members')
      .insert({ organization_id: organizationId, user_id: targetUser.id, role: 'member' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(organizationId: string, userId: string) {
    const { error } = await this.supabaseService.client
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  }
}