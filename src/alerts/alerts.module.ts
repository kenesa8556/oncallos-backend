import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [ApiKeysModule],
  controllers: [AlertsController],
})
export class AlertsModule {}