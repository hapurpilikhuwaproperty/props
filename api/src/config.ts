import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Allow a deployment-local override file for hosted environments.
if (fs.existsSync('hostinger-api.env')) {
  dotenv.config({ path: 'hostinger-api.env', override: true });
}

// Local-only overrides. This file is gitignored and is not included in Hostinger archives.
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}

const mysqlHost = process.env.MYSQL_HOST;
const mysqlUser = process.env.MYSQL_USER;
const mysqlPassword = process.env.MYSQL_PASSWORD;
const mysqlDatabase = process.env.MYSQL_DATABASE;
const mysqlPort = process.env.MYSQL_PORT || '3306';

if (mysqlHost && mysqlUser && mysqlPassword && mysqlDatabase) {
  process.env.DATABASE_URL = `mysql://${encodeURIComponent(mysqlUser)}:${encodeURIComponent(
    mysqlPassword,
  )}@${mysqlHost}:${mysqlPort}/${encodeURIComponent(mysqlDatabase)}`;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret';
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const unsafeJwtSecrets = new Set([
  'access-secret',
  'refresh-secret',
  'your-long-random-secret',
  'your-second-long-random-secret',
  'change-me-access',
  'change-me-refresh',
]);

const splitEnvList = (value?: string) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeUrlOrigin = (value: string) => {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return value.trim().replace(/\/+$/, '');
  }
};

const configuredFrontendUrls = Array.from(
  new Set([...splitEnvList(process.env.FRONTEND_URLS), ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])].map(normalizeUrlOrigin).filter(Boolean)),
);
const frontendUrls = configuredFrontendUrls.length ? configuredFrontendUrls : ['http://localhost:3000'];
const frontendUrl = frontendUrls[0];
const cookieSameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
const resolvedCookieSameSite = ['lax', 'strict', 'none'].includes(cookieSameSite) ? (cookieSameSite as 'lax' | 'strict' | 'none') : 'lax';
const resolvedCookieSecure = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : nodeEnv === 'production' || resolvedCookieSameSite === 'none';
const corsOrigins = Array.from(
  new Set((process.env.CORS_ORIGINS ? splitEnvList(process.env.CORS_ORIGINS) : frontendUrls).map(normalizeUrlOrigin).filter(Boolean)),
);

export const resolveFrontendUrl = (candidate?: string | null) => {
  if (!candidate) return frontendUrl;
  const origin = normalizeUrlOrigin(candidate);
  return frontendUrls.includes(origin) ? origin : frontendUrl;
};

if (nodeEnv === 'production') {
  if (
    unsafeJwtSecrets.has(accessTokenSecret) ||
    unsafeJwtSecrets.has(refreshTokenSecret) ||
    accessTokenSecret.length < 32 ||
    refreshTokenSecret.length < 32 ||
    accessTokenSecret === refreshTokenSecret
  ) {
    throw new Error('Strong JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be configured in production');
  }
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv,
  isProduction: nodeEnv === 'production',
  accessTokenSecret,
  refreshTokenSecret,
  accessTokenTtl: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  frontendUrl,
  frontendUrls,
  corsOrigins,
  backendUrl: process.env.BACKEND_URL || `http://localhost:${Number(process.env.PORT) || 4000}`,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  auth: {
    issuer: process.env.AUTH_ISSUER || 'Hapur Pilkhuwa Property',
    magicLinkTtlMinutes: Number(process.env.MAGIC_LINK_TTL_MINUTES || 15),
    otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES || 5),
    otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
    adminMfaChallengeTtlMinutes: Number(process.env.ADMIN_MFA_CHALLENGE_TTL_MINUTES || 5),
    adminMfaRequired: process.env.ADMIN_MFA_REQUIRED
      ? process.env.ADMIN_MFA_REQUIRED === 'true'
      : nodeEnv === 'production',
  },
  sms: {
    webhookUrl: process.env.SMS_WEBHOOK_URL,
    apiKey: process.env.SMS_API_KEY,
  },
  cookies: {
    accessTokenName: process.env.ACCESS_TOKEN_COOKIE_NAME || 'props_access',
    refreshTokenName: process.env.REFRESH_TOKEN_COOKIE_NAME || 'props_refresh',
    secure: resolvedCookieSecure,
    sameSite: resolvedCookieSameSite,
  },
  uploads: {
    maxImageSizeMb: Number(process.env.IMAGE_UPLOAD_MAX_MB || 5),
    maxVideoSizeMb: Number(process.env.VIDEO_UPLOAD_MAX_MB || 75),
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  aws: {
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  email: {
    from: process.env.EMAIL_FROM,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};
