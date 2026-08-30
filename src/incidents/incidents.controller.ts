import { Controller, Get, Param, UseGuards, Headers, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @UseGuards(SupabaseAuthGuard)
  @Get()
  async getAll(@CurrentUser() user, @Headers('x-organization-id') organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('X-Organization-Id header is required');
    }

    const { data, error } = await this.supabaseService.client
      .from('incidents')
      .select('id, title, severity, status, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return data;
  }

  @UseGuards(SupabaseAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: string, @Headers('x-organization-id') organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('X-Organization-Id header is required');
    }

    const { data: incident, error: incidentError } = await this.supabaseService.client
      .from('incidents')
      .select('id, title, severity, status, created_at')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (incidentError || !incident) {
      return { error: 'Incident not found' };
    }

    const [diagnosesResult, resolutionsResult, snapshotsResult] = await Promise.all([
      this.supabaseService.client.from('diagnoses').select('*').eq('incident_id', id),
      this.supabaseService.client.from('resolutions').select('*').eq('incident_id', id),
      this.supabaseService.client.from('snapshots').select('*').eq('incident_id', id),
    ]);

    return {
      incident,
      diagnoses: diagnosesResult.data ?? [],
      resolutions: resolutionsResult.data ?? [],
      snapshots: snapshotsResult.data ?? [],
    };
  }
}