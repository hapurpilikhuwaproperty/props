import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import hpp from 'hpp';
import xssClean from 'xss-clean';
import path from 'path';
import { apiLimiter } from './middleware/rateLimit';
import { httpLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import propertyRoutes from './routes/properties';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import leadRoutes from './routes/leads';
import visitRoutes from './routes/visits';
import intelligenceRoutes from './routes/intelligence';
import shortlistRoutes from './routes/shortlists';

const app = express();

app.use(helmet());
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use(xssClean());
app.use(compression());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(httpLogger);
app.use(apiLimiter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

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
