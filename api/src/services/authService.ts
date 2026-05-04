import { prisma } from '../prisma/client.js';
import argon2 from 'argon2';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt.js';
import { addDays, addMinutes, isAfter } from 'date-fns';
import crypto, { createHash } from 'crypto';
import { sendLeadEmail } from './notify.js';
import { config, resolveFrontendUrl } from '../config.js';
import { buildTotpUri, generateTotpSecret, verifyTotp } from '../utils/totp.js';
import { isAdminRole, isSellerRole, normalizeRole } from '../utils/roles.js';

export type SessionContext = {
  userAgent?: string;
  ipAddress?: string;
};

type UserWithRole = NonNullable<Awaited<ReturnType<typeof getUserWithRole>>>;

export type AuthResult =
  | Awaited<ReturnType<typeof issueTokens>>
  | {
      mfaRequired: true;
      setupRequired: boolean;
      challengeId: string;
      secret?: string;
      otpauthUrl?: string;
      user: ReturnType<typeof serializeUser>;
    };

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const normalizePhone = (phone: string) => phone.replace(/[^\d+]/g, '');

const getRole = (name: 'Guest' | 'Seller' | 'Admin') =>
  prisma.role.upsert({ where: { name }, update: {}, create: { name } });

const getUserWithRole = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  if (!user) throw { status: 401, message: 'Unauthorized' };
  return user;
};

const serializeUser = (user: UserWithRole) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  verified: user.verified,
  emailVerified: Boolean(user.emailVerifiedAt),
  phoneVerified: Boolean(user.phoneVerifiedAt),
  sellerVerificationStatus: user.sellerVerificationStatus,
  role: normalizeRole(user.role.name),
});

const createSession = async (userId: number, context: SessionContext, sessionId?: number | null) => {
  const now = new Date();
  if (sessionId) {
    return prisma.authSession.update({
      where: { id: sessionId },
      data: {
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        lastUsedAt: now,
        revokedAt: null,
      },
    });
  }

  return prisma.authSession.create({
    data: {
      deviceId: randomToken(24),
      userId,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
      lastUsedAt: now,
    },
  });
};

const createAdminMfaChallenge = async (user: UserWithRole) => {
  const setupRequired = !user.mfaEnabled || !user.mfaSecret;
  const secret = setupRequired ? generateTotpSecret() : undefined;
  const challenge = await prisma.authChallenge.create({
    data: {
      challengeId: randomToken(24),
      userId: user.id,
      type: setupRequired ? 'ADMIN_MFA_SETUP' : 'ADMIN_MFA_LOGIN',
      secret,
      expiresAt: addMinutes(new Date(), config.auth.adminMfaChallengeTtlMinutes),
    },
  });

  return {
    mfaRequired: true as const,
    setupRequired,
    challengeId: challenge.challengeId,
    secret,
    otpauthUrl: secret ? buildTotpUri(config.auth.issuer, user.email || user.phone || user.name, secret) : undefined,
    user: serializeUser(user),
  };
};

const finishPrimaryAuth = async (user: UserWithRole, context: SessionContext): Promise<AuthResult> => {
  if (isAdminRole(user.role.name) && config.auth.adminMfaRequired) {
    return createAdminMfaChallenge(user);
  }
  return issueTokens(user.id, user.role.name, context);
};

export const register = async (name: string, email: string, password: string, phone: string, context: SessionContext) => {
  const normalizedEmail = normalizeEmail(email);
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw { status: 400, message: 'Email already registered' };
  const hashed = await argon2.hash(password);
  const role = await getRole('Guest');
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashed,
      phone: normalizePhone(phone),
      roleId: role.id,
      authProvider: 'PASSWORD',
    },
    include: { role: true },
  });
  return issueTokens(user.id, user.role.name, context);
};

export const login = async (email: string, password: string, context: SessionContext) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail }, include: { role: true } });
  if (!user || !user.password) throw { status: 401, message: 'Invalid credentials' };
  const match = await argon2.verify(user.password, password);
  if (!match) throw { status: 401, message: 'Invalid credentials' };
  return finishPrimaryAuth(user, context);
};

export const loginWithGoogle = async (idToken: string, context: SessionContext) => {
  if (!config.google.clientId) throw { status: 500, message: 'Google login is not configured' };

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!response.ok) throw { status: 401, message: 'Invalid Google token' };
  const payload = (await response.json()) as {
    aud?: string;
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
  };

  if (payload.aud !== config.google.clientId || !payload.sub || !payload.email) {
    throw { status: 401, message: 'Invalid Google token' };
  }
  if (payload.email_verified !== true && payload.email_verified !== 'true') {
    throw { status: 401, message: 'Google email is not verified' };
  }

  const email = normalizeEmail(payload.email);
  const role = await getRole('Guest');
  const existingByGoogle = await prisma.user.findUnique({ where: { googleSubject: payload.sub }, include: { role: true } });
  if (existingByGoogle && isAdminRole(existingByGoogle.role.name)) {
    throw { status: 403, message: 'Admin accounts must use password and MFA login.' };
  }

  const existingByEmail = existingByGoogle ? null : await prisma.user.findUnique({ where: { email }, include: { role: true } });
  if (existingByEmail && isAdminRole(existingByEmail.role.name)) {
    throw { status: 403, message: 'Admin accounts must use password and MFA login.' };
  }

  const user =
    existingByGoogle ||
    (await prisma.user.upsert({
      where: { email },
      update: {
        googleSubject: payload.sub,
        emailVerifiedAt: new Date(),
        verified: true,
      },
      create: {
        name: payload.name || email.split('@')[0],
        email,
        googleSubject: payload.sub,
        emailVerifiedAt: new Date(),
        verified: true,
        authProvider: 'GOOGLE',
        roleId: role.id,
      },
      include: { role: true },
    }));

  return finishPrimaryAuth(user, context);
};

export const requestMagicLink = async (email: string, redirectUrl?: string | null) => {
  const normalizedEmail = normalizeEmail(email);
  const token = randomToken();
  const expiresAt = addMinutes(new Date(), config.auth.magicLinkTtlMinutes);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true, password: true } });
  const frontendUrl = resolveFrontendUrl(redirectUrl);

  await prisma.magicLinkToken.create({
    data: { email: normalizedEmail, tokenHash: hashToken(token), expiresAt },
  });

  const magicLink = `${config.backendUrl.replace(/\/+$/, '')}/auth/magic-link?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(frontendUrl)}`;
  await sendLeadEmail('Your sign-in link', `Use this link to sign in: ${magicLink}`, normalizedEmail);

  return {
    sent: true,
    flow: 'magic_link' as const,
    passwordFallback: Boolean(user?.password),
    ...(config.isProduction ? {} : { magicLink }),
  };
};

export const verifyMagicLink = async (token: string, context: SessionContext) => {
  const record = await prisma.magicLinkToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.used || isAfter(new Date(), record.expiresAt)) {
    throw { status: 400, message: 'Magic link is invalid or expired' };
  }

  const role = await getRole('Guest');
  const user = await prisma.user.upsert({
    where: { email: record.email },
    update: {
      emailVerifiedAt: new Date(),
      verified: true,
    },
    create: {
      name: record.email.split('@')[0],
      email: record.email,
      emailVerifiedAt: new Date(),
      verified: true,
      authProvider: 'EMAIL_MAGIC',
      roleId: role.id,
    },
    include: { role: true },
  });

  await prisma.magicLinkToken.update({ where: { id: record.id }, data: { used: true } });
  return finishPrimaryAuth(user, context);
};

export const loginWithVerifiedOtp = async (params: { channel: 'EMAIL' | 'PHONE'; identifier: string }, context: SessionContext) => {
  const role = await getRole('Guest');
  const verifiedAt = new Date();

  const user =
    params.channel === 'EMAIL'
      ? await prisma.user.upsert({
          where: { email: normalizeEmail(params.identifier) },
          update: { emailVerifiedAt: verifiedAt, verified: true },
          create: {
            name: normalizeEmail(params.identifier).split('@')[0],
            email: normalizeEmail(params.identifier),
            emailVerifiedAt: verifiedAt,
            verified: true,
            authProvider: 'EMAIL_MAGIC',
            roleId: role.id,
          },
          include: { role: true },
        })
      : await prisma.user.upsert({
          where: { phone: normalizePhone(params.identifier) },
          update: { phoneVerifiedAt: verifiedAt, verified: true },
          create: {
            name: normalizePhone(params.identifier),
            phone: normalizePhone(params.identifier),
            phoneVerifiedAt: verifiedAt,
            verified: true,
            authProvider: 'PHONE_OTP',
            roleId: role.id,
          },
          include: { role: true },
        });

  return finishPrimaryAuth(user, context);
};

export const verifyAdminMfa = async (challengeId: string, code: string, context: SessionContext) => {
  const challenge = await prisma.authChallenge.findUnique({
    where: { challengeId },
    include: { user: { include: { role: true } } },
  });

  if (!challenge || challenge.used || isAfter(new Date(), challenge.expiresAt)) {
    throw { status: 401, message: 'MFA challenge expired' };
  }
  if (!isAdminRole(challenge.user.role.name)) throw { status: 403, message: 'Forbidden' };

  const secret = challenge.type === 'ADMIN_MFA_SETUP' ? challenge.secret : challenge.user.mfaSecret;
  if (!secret || !verifyTotp(secret, code)) throw { status: 401, message: 'Invalid MFA code' };

  await prisma.$transaction([
    prisma.authChallenge.update({ where: { id: challenge.id }, data: { used: true } }),
    ...(challenge.type === 'ADMIN_MFA_SETUP'
      ? [
          prisma.user.update({
            where: { id: challenge.userId },
            data: { mfaEnabled: true, mfaSecret: secret, mfaVerifiedAt: new Date() },
          }),
        ]
      : []),
  ]);

  return issueTokens(challenge.user.id, challenge.user.role.name, context);
};

export const refresh = async (token: string, context: SessionContext) => {
  try {
    verifyRefreshToken(token);
  } catch {
    throw { status: 401, message: 'Invalid refresh token' };
  }
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { role: true } }, session: true },
  });
  if (!stored || stored.revoked || stored.expiresAt < new Date() || stored.session?.revokedAt) {
    throw { status: 401, message: 'Invalid refresh token' };
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revoked: true, revokedAt: new Date(), lastUsedAt: new Date() },
  });
  return issueTokens(stored.user.id, stored.user.role.name, context, stored.sessionId);
};

export const issueTokens = async (userId: number, role: string, context: SessionContext, sessionId?: number | null) => {
  const session = await createSession(userId, context, sessionId);
  const accessToken = signAccessToken({ userId, role: normalizeRole(role) });
  const refreshToken = signRefreshToken({ userId, sessionId: session.id });
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId,
      sessionId: session.id,
      expiresAt: addDays(new Date(), 7),
    },
  });
  const user = await getUserWithRole(userId);
  return { accessToken, refreshToken, user: serializeUser(user) };
};

export const resolveSession = async (accessToken?: string, refreshToken?: string, context: SessionContext = {}) => {
  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken) as { userId?: number };
      if (payload.userId) {
        const user = await getUserWithRole(payload.userId);
        return { user: serializeUser(user) };
      }
    } catch {
      // Fall through to refresh-token restoration.
    }
  }

  if (!refreshToken) throw { status: 401, message: 'Unauthorized' };
  const session = await refresh(refreshToken, context);
  return { user: session.user, tokens: { accessToken: session.accessToken, refreshToken: session.refreshToken } };
};

export const logout = async (token?: string) => {
  if (!token) return;
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) } });
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revoked: false },
    data: { revoked: true, revokedAt: new Date() },
  });
  if (stored?.sessionId) {
    await prisma.authSession.updateMany({
      where: { id: stored.sessionId },
      data: { revokedAt: new Date() },
    });
  }
};

export const listSessions = async (userId: number) =>
  prisma.authSession.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastUsedAt: 'desc' },
    select: {
      id: true,
      deviceId: true,
      userAgent: true,
      ipAddress: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

export const revokeSession = async (userId: number, sessionId: number) => {
  await prisma.authSession.updateMany({
    where: { id: sessionId, userId },
    data: { revokedAt: new Date() },
  });
  await prisma.refreshToken.updateMany({
    where: { sessionId, userId, revoked: false },
    data: { revoked: true, revokedAt: new Date() },
  });
};

export const requestSellerUpgrade = async (userId: number) => {
  const user = await getUserWithRole(userId);
  if (isAdminRole(user.role.name) || isSellerRole(user.role.name)) return serializeUser(user);
  if (!user.emailVerifiedAt && !user.phoneVerifiedAt) {
    throw { status: 400, message: 'Verify an email or phone number before requesting seller access' };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { sellerVerificationStatus: 'PENDING' },
    include: { role: true },
  });
  return serializeUser(updated);
};

export const setSellerApproval = async (userId: number, approved: boolean) => {
  const role = approved ? await getRole('Seller') : null;
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      sellerVerificationStatus: approved ? 'APPROVED' : 'REJECTED',
      sellerVerifiedAt: approved ? new Date() : null,
      ...(role ? { roleId: role.id } : {}),
    },
    include: { role: true },
  });
  return serializeUser(updated);
};

export const getProfile = async (userId: number) => {
  const user = await getUserWithRole(userId);
  return serializeUser(user);
};

export const hashPlaceholder = () => argon2.hash(randomToken());
