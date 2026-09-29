import { Controller, Get, Post, Param, Body, Headers, UseGuards, BadRequestException } from '@nestjs/common';
import { IncidentChatService } from './incident-chat.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('incidents/:incidentId/chat')
export class IncidentChatController {
  constructor(private readonly incidentChatService: IncidentChatService) {}

  @Get()
  async list(@Param('incidentId') incidentId: string, @Headers('x-organization-id') organizationId: string) {
    if (!organizationId) throw new BadRequestException('X-Organization-Id header is required');
    return this.incidentChatService.listMessages(incidentId, organizationId);
  }

  @Post()
  async send(
    @Param('incidentId') incidentId: string,
    @Body('message') message: string,
    @Headers('x-organization-id') organizationId: string,
  ) {
    if (!organizationId) throw new BadRequestException('X-Organization-Id header is required');
    if (!message?.trim()) throw new BadRequestException('message is required');
    return this.incidentChatService.sendMessage(incidentId, organizationId, message);
  }
}