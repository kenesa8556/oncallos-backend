import { Controller, Post, Body, HttpCode, UseGuards, Req } from '@nestjs/common';
import { alertsQueue } from './alerts.queue';
import { ApiKeyGuard } from '../api-keys/api-key.guard';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @UseGuards(ApiKeyGuard)
  @Post()
  @HttpCode(202)
  async receiveAlert(@Body() payload: any, @Req() request: any) {
    if (!payload.title || !payload.severity || !payload.service) {
      return { error: 'title, severity, and service are required' };
    }

    const organizationId = request.organizationId;
    await this.apiKeysService.checkIncidentLimit(organizationId);

    await alertsQueue.add('process-alert', { ...payload, organizationId });
    return { received: true };
  }
}