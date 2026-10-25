import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import './alerts/alerts.worker';
import './verification/verification.worker';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  // CORS_ORIGINS=https://www.myapp.com
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, '')) // trim spaces + trailing slash
    .filter(Boolean);

    app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false); // reject without throwing a 500
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Organization-Id',
      'X-Api-Key',
    ],
    credentials: true,
  });

  app.use('/webhooks/stripe', bodyParser.raw({ type: 'application/json' }));
  app.use(bodyParser.json());

  await app.listen(process.env.PORT ?? 3001);

  await import('./alerts/alerts.worker.js');
  await import('./verification/verification.worker.js');
}
bootstrap();