import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CloudCredentialsService } from './cloud-credentials.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(SupabaseAuthGuard)
@Controller('organizations/:orgId/cloud-credentials')
export class CloudCredentialsController {
  constructor(private readonly cloudCredentialsService: CloudCredentialsService) {}

  @Get()
  async list(@Param('orgId') orgId: string) {
    return this.cloudCredentialsService.list(orgId);
  }

  @Post()
  async add(
    @Param('orgId') orgId: string,
    @Body('serviceName') serviceName: string,
    @Body('token') token: string,
    @Body('serviceId') serviceId: string,
    @Body('environmentId') environmentId: string,
    @CurrentUser() user,
  ) {
    return this.cloudCredentialsService.add(orgId, user.id, serviceName, token, serviceId, environmentId);
  }

  @Delete(':id')
  async remove(@Param('orgId') orgId: string, @Param('id') id: string, @CurrentUser() user) {
    return this.cloudCredentialsService.remove(orgId, user.id, id);
  }
}