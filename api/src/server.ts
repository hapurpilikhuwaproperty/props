import { config } from './config';
import app from './app';
import { prisma } from './prisma/client';
import { log } from './utils/logger';

const start = async () => {
  try {
    await prisma.$connect();
    app.listen(config.port, () => log.info(`API listening on port ${config.port}`));
  } catch (err) {
    log.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
