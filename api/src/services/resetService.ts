import crypto from 'crypto';
import { addHours, isAfter } from 'date-fns';
import { prisma } from '../prisma/client.js';
import { sendLeadEmail } from './notify.js';
import argon2 from 'argon2';
import { resolveFrontendUrl } from '../config.js';

const RESET_TTL_HOURS = 4;
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export async function createReset(email: string, redirectUrl?: string | null) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return; // do not leak
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = addHours(new Date(), RESET_TTL_HOURS);
  await prisma.passwordReset.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });
  await prisma.passwordReset.create({ data: { tokenHash, userId: user.id, expiresAt } });
  await sendLeadEmail('Password reset', `Reset link: ${resolveFrontendUrl(redirectUrl)}/auth/reset?token=${token}`, normalizedEmail);
}

export async function completeReset(token: string, newPassword: string) {
  const rec = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!rec || rec.used || isAfter(new Date(), rec.expiresAt)) throw { status: 400, message: 'Invalid or expired token' };
  const hash = await argon2.hash(newPassword);
  await prisma.user.update({ where: { id: rec.userId }, data: { password: hash } });
  await prisma.refreshToken.updateMany({ where: { userId: rec.userId, revoked: false }, data: { revoked: true, revokedAt: new Date() } });
  await prisma.passwordReset.update({ where: { id: rec.id }, data: { used: true } });
}
