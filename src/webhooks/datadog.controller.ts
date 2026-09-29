import { Controller, Post, Body, Headers, UnauthorizedException, HttpCode, UseGuards, Req } from '@nestjs/common';
import { DatadogMapperService } from './datadog-mapper.service';
import { alertsQueue } from '../alerts/alerts.queue';
import { ApiKeyGuard } from '../api-keys/api-key.guard';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { OrganizationsService } from '../organizations/organizations.service';

@Controller('webhooks/datadog')
export class DatadogController {
  constructor(
    private readonly mapperService: DatadogMapperService,
    private readonly apiKeysService: ApiKeysService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  @UseGuards(ApiKeyGuard)
  @Post()
  @HttpCode(202)
  async receiveWebhook(
    @Body() payload: any,
    @Headers('x-webhook-secret') secret: string,
    @Req() request: any,
  ) {
    const organizationId = request.organizationId;
    await this.apiKeysService.checkIncidentLimit(organizationId);

    const expectedSecret = await this.organizationsService.getOrCreateDatadogWebhookSecret(organizationId);

    if (secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid webhook secret for this organization');
    }

    const alert = this.mapperService.mapToInternalAlert(payload);

    await alertsQueue.add('process-alert', { ...alert, organizationId });

    return { received: true };
  }
}