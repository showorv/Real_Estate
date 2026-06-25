import { createApp } from './app';
import { connectDB } from './app/config/db';
import { env } from './app/config/env';

async function main() {
  try {
    await connectDB();

    const app = createApp();

    const server = app.listen(env.port, () => {
      console.log(`[server] Running in ${env.nodeEnv} mode on port ${env.port}`);
    });

    // Graceful shutdown — let in-flight requests finish before closing
    const shutdown = (signal: string) => {
      console.log(`[server] ${signal} received, shutting down gracefully`);
      server.close(() => {
        console.log('[server] Closed remaining connections');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

main();