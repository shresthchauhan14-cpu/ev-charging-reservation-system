import { app } from './app.js';
import { db } from './database/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    console.log('[Server] Connecting to database...');
    await db.init();
    console.log(`[Server] Database ready (${db.getEngineMode()})`);

    const server = app.listen(PORT, () => {
      console.log(`==================================================================`);
      console.log(`  EV Charging Reservation & Real-Time Availability Backend API   `);
      console.log(`  IILM University, Greater Noida - B.Tech CSE Major Project       `);
      console.log(`==================================================================`);
      console.log(`  Server Port    : http://localhost:${PORT}`);
      console.log(`  Health Check   : http://localhost:${PORT}/api/health`);
      console.log(`  Project Info   : http://localhost:${PORT}/api/project-info`);
      console.log(`  Database Engine: ${db.getEngineMode()}`);
      console.log(`==================================================================`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        await db.close();
        console.log('[Server] Database connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('[Server] Fatal bootstrap error:', err);
    process.exit(1);
  }
}

bootstrap();

