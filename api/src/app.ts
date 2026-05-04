import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import hpp from 'hpp';
import xssClean from 'xss-clean';
import path from 'path';
import { apiLimiter } from './middleware/rateLimit.js';
import { httpLogger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import propertyRoutes from './routes/properties.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import leadRoutes from './routes/leads.js';
import visitRoutes from './routes/visits.js';
import intelligenceRoutes from './routes/intelligence.js';
import shortlistRoutes from './routes/shortlists.js';
import { prisma } from './prisma/client.js';
import { config } from './config.js';

const app = express();

app.use(helmet());
const allowedOrigins = new Set(config.corsOrigins);
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, !origin || allowedOrigins.has(origin));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use(xssClean());
app.use(compression());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(httpLogger);
app.use(apiLimiter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string'
        ? err.code
        : 'UNKNOWN';
    const message = err instanceof Error ? err.message : String(err);
    const reason = /DATABASE_URL|environment variable/i.test(message)
      ? 'missing_or_invalid_database_url'
      : /access denied|authentication|permission|P1000/i.test(message)
        ? 'database_auth_failed'
        : /cannot reach|can't reach|connect|ECONNREFUSED|ETIMEDOUT|P1001/i.test(message)
          ? 'database_unreachable'
          : /does not exist|unknown database|P1003|P1010/i.test(message)
            ? 'database_not_found_or_denied'
            : 'database_error';
    res.status(503).json({
      status: 'error',
      database: 'unavailable',
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      code,
      reason,
    });
  }
});

app.use('/auth', authRoutes);
app.use('/properties', propertyRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/leads', leadRoutes);
app.use('/visits', visitRoutes);
app.use('/intelligence', intelligenceRoutes);
app.use('/shortlists', shortlistRoutes);

app.use(errorHandler);

export default app;
