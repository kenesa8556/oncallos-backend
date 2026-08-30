import { Controller, Post, Body, Headers, UnauthorizedException, HttpCode } from '@nestjs/common';
import { DatadogMapperService } from './datadog-mapper.service';
import { alertsQueue } from '../alerts/alerts.queue';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Controller('webhooks/datadog')
export class DatadogController {
  constructor(
    private readonly mapperService: DatadogMapperService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  @Post()
  @HttpCode(202)
 async receiveWebhook(
  @Body() payload: any,
  @Headers('x-webhook-secret') secret: string,
  @Headers('x-api-key') apiKey: string,
) {
  console.log('Received secret:', JSON.stringify(secret));
  console.log('Expected secret:', JSON.stringify(process.env.DATADOG_WEBHOOK_SECRET));

  if (secret !== process.env.DATADOG_WEBHOOK_SECRET) {
    throw new UnauthorizedException('Invalid webhook secret');
  }
  // ...rest unchanged

    // Datadog webhooks can't send a per-org API key dynamically, so for now
    // this endpoint identifies the org via a query param or the same
    // X-API-Key mechanism your other integrations use — validated the same way.
    const keyRecord = await this.apiKeysService.validateKey(apiKey);

    const alert = this.mapperService.mapToInternalAlert(payload);

    await alertsQueue.add('process-alert', { ...alert, organizationId: keyRecord.organization_id });

    return { received: true };
  }
}