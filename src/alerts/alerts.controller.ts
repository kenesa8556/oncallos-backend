import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { alertsQueue } from './alerts.queue';

@Controller('alerts')
export class AlertsController {
  @Post()
@HttpCode(202)
async receiveAlert(@Body() payload: any) {
  if (!payload.title || !payload.severity || !payload.service) {
    return { error: 'title, severity, and service are required' };
  }

  await alertsQueue.add('process-alert', payload);

  return { received: true };
}
}