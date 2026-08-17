import 'dotenv/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';



const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const alertsQueue = new Queue('alerts', { connection });