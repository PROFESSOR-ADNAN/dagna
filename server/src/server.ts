import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

async function bootstrap() {
  await connectDB();
  console.log('MongoDB connected successfully');

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`Dagna Core API listening on http://127.0.0.1:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Gracefully shutting down server...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });

    // Force exit after 10s timeout
    setTimeout(() => {
      console.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
