import 'dotenv/config';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { VerificationService } from './verification.service';

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

async function startVerificationWorker() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const verificationService = app.get(VerificationService);

  const worker = new Worker(
    'verification',
    async (job) => {
      console.log('Running delayed verification for:', job.data.alert.title);
      const result = await verificationService.verify(job.data.diagnosis, job.data.incident);
      console.log('Verification result:', result);
    },
    { connection },
  );

  worker.on('completed', (job) => console.log(`Verification job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`Verification job ${job?.id} failed:`, err.message));
}

startVerificationWorker();