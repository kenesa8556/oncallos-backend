import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { encrypt, decrypt } from './crypto.util';
import { RailwayTool } from '../execution/tools/railway.tool';

@Injectable()
export class CloudCredentialsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly railwayTool: RailwayTool,
  ) {}

  private async requireOwner(organizationId: string, userId: string) {
    const { data: membership } = await this.supabaseService.client
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'owner') {
      throw new ForbiddenException('Only the org owner can configure execution services');
    }
  }

  async list(organizationId: string) {
    const { data, error } = await this.supabaseService.client
      .from('railway_services')
      .select('id, service_name, railway_service_id, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async add(
    organizationId: string,
    userId: string,
    serviceName: string,
    token: string,
    railwayServiceId: string,
    environmentId: string,
  ) {
    await this.requireOwner(organizationId, userId);

    try {
      await this.railwayTool.getCurrentDeployment(token, railwayServiceId, environmentId);
    } catch (err: any) {
      throw new BadRequestException(
        `Could not verify these credentials against Railway: ${err.message}`,
      );
    }

    const { data, error } = await this.supabaseService.client
      .from('railway_services')
      .insert({
        organization_id: organizationId,
        service_name: serviceName,
        encrypted_token: encrypt(token),
        railway_service_id: railwayServiceId,
        railway_environment_id: environmentId,
      })
      .select('id, service_name, railway_service_id, created_at')
      .single();

    if (error) throw error;
    return data;
  }

  async remove(organizationId: string, userId: string, id: string) {
    await this.requireOwner(organizationId, userId);

    const { error } = await this.supabaseService.client
      .from('railway_services')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return { success: true };
  }

  // Used internally by execution/verification — looks up a service BY NAME,
  // matching what a diagnosis's toolArgs.service actually says.
  async getDecryptedCredentialsByName(organizationId: string, serviceName: string) {
    const { data, error } = await this.supabaseService.client
      .from('railway_services')
      .select('encrypted_token, railway_service_id, railway_environment_id')
      .eq('organization_id', organizationId)
      .eq('service_name', serviceName)
      .single();

    if (error || !data) {
      throw new NotFoundException(`No execution service named "${serviceName}" configured for this organization`);
    }

    return {
      token: decrypt(data.encrypted_token),
      serviceId: data.railway_service_id,
      environmentId: data.railway_environment_id,
    };
  }
}