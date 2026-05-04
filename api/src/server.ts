import { config } from './config.js';
import app from './app.js';
import { prisma } from './prisma/client.js';
import { log } from './utils/logger.js';

const start = async () => {
  const server = app.listen(config.port, () => log.info(`API listening on port ${config.port}`));

  try {
    await prisma.$connect();
    log.info('Database connection established');
  } catch (err) {
    log.error('Database connection failed; API will keep serving liveness checks', err);
  }

  const shutdown = async () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start();
