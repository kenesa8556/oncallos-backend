import 'dotenv/config';
import Redis from 'ioredis';

const client = new Redis(process.env.REDIS_URL!);

client.set('foo', 'bar').then(() => {
  console.log('SUCCESS: Redis connection works');
  process.exit(0);
}).catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});