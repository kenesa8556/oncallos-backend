import { Module } from '@nestjs/common';
import { DatadogController } from './datadog.controller';
import { DatadogMapperService } from './datadog-mapper.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [ApiKeysModule],
  controllers: [DatadogController],
  providers: [DatadogMapperService],
})
export class WebhooksModule {}