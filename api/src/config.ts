import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'access-secret';
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

if (nodeEnv === 'production') {
  if (accessTokenSecret === 'access-secret' || refreshTokenSecret === 'refresh-secret') {
    throw new Error('JWT secrets must be configured in production');
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
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL || `http://localhost:${Number(process.env.PORT) || 4000}`,
  cookies: {
    accessTokenName: process.env.ACCESS_TOKEN_COOKIE_NAME || 'props_access',
    refreshTokenName: process.env.REFRESH_TOKEN_COOKIE_NAME || 'props_refresh',
    secure: nodeEnv === 'production',
    sameSite: 'lax' as const,
  },
  uploads: {
    maxImageSizeMb: Number(process.env.IMAGE_UPLOAD_MAX_MB || 5),
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
