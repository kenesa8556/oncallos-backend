import { Controller, Get, Patch, Param, Body, UseGuards, Headers, BadRequestException } from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('diagnoses')
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Get('pending')
  async listPending(@Headers('x-organization-id') organizationId: string) {
    if (!organizationId) throw new BadRequestException('X-Organization-Id header is required');
    return this.diagnosisService.listPending(organizationId);
  }

  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected',
    @Headers('x-organization-id') organizationId: string,
  ) {
    if (!organizationId) throw new BadRequestException('X-Organization-Id header is required');
    if (!['approved', 'rejected'].includes(status)) throw new BadRequestException('status must be approved or rejected');
    return this.diagnosisService.updateStatus(id, organizationId, status);
  }
}