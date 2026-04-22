import { prisma } from '../prisma/client';
import argon2 from 'argon2';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt';
import { addDays } from 'date-fns';
import { createHash } from 'crypto';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const getUserWithRole = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  if (!user) throw { status: 401, message: 'Unauthorized' };
  return user;
};

const serializeUser = (user: Awaited<ReturnType<typeof getUserWithRole>>) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  verified: user.verified,
  role: user.role.name,
});

export const register = async (name: string, email: string, password: string, phone?: string) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw { status: 400, message: 'Email already registered' };
  const hashed = await argon2.hash(password);
  const userRole = await prisma.role.findUnique({ where: { name: 'User' } });
  if (!userRole) throw { status: 500, message: 'Role missing, seed roles' };
  const user = await prisma.user.create({
    data: { name, email, password: hashed, phone, roleId: userRole.id },
    include: { role: true },
  });
  return issueTokens(user.id, user.role.name);
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
  if (!user) throw { status: 401, message: 'Invalid credentials' };
  const match = await argon2.verify(user.password, password);
  if (!match) throw { status: 401, message: 'Invalid credentials' };
  return issueTokens(user.id, user.role.name);
};

export const refresh = async (token: string) => {
  try {
    verifyRefreshToken(token);
  } catch {
    throw { status: 401, message: 'Invalid refresh token' };
  }
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { role: true } } },
  });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) throw { status: 401, message: 'Invalid refresh token' };
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  return issueTokens(stored.user.id, stored.user.role.name);
};

export const issueTokens = async (userId: number, role: string, existingRefresh?: string) => {
  const accessToken = signAccessToken({ userId, role });
  let refreshToken = existingRefresh;
  if (!existingRefresh) {
    refreshToken = signRefreshToken({ userId });
    await prisma.refreshToken.create({
      data: { tokenHash: hashToken(refreshToken), userId, expiresAt: addDays(new Date(), 7) },
    });
  }
  const user = await getUserWithRole(userId);
  return { accessToken, refreshToken, user: serializeUser(user) };
};

export const resolveSession = async (accessToken?: string, refreshToken?: string) => {
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
  const session = await refresh(refreshToken);
  return { user: session.user, tokens: { accessToken: session.accessToken, refreshToken: session.refreshToken! } };
};

export const logout = async (token?: string) => {
  if (!token) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revoked: false },
    data: { revoked: true },
  });
};

export const getProfile = async (userId: number) => {
  const user = await getUserWithRole(userId);
  return serializeUser(user);
};

export const hashPlaceholder = () => argon2.hash('temp-password');
