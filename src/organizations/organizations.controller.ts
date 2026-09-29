import { Controller, Post, Body, UseGuards, Patch, Get, Param } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @UseGuards(SupabaseAuthGuard)
  @Post()
  async create(@Body('name') name: string, @CurrentUser() user) {
    return this.organizationsService.create(name, user.id);
  }

  @UseGuards(SupabaseAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body('name') name: string, @CurrentUser() user) {
    return this.organizationsService.update(id, user.id, name);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get(':id/integrations/datadog')
  async getDatadogWebhookSecret(@Param('id') id: string) {
    const secret = await this.organizationsService.getOrCreateDatadogWebhookSecret(id);
    return { webhookSecret: secret };
  }

  @UseGuards(SupabaseAuthGuard)
  @Post(':id/integrations/datadog/regenerate')
  async regenerateDatadogWebhookSecret(@Param('id') id: string, @CurrentUser() user) {
    const secret = await this.organizationsService.regenerateDatadogWebhookSecret(id, user.id);
    return { webhookSecret: secret };
  }
}