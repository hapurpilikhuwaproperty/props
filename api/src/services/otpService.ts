import crypto from 'crypto';
import { addMinutes, isAfter } from 'date-fns';
import { prisma } from '../prisma/client';
import { sendLeadEmail } from './notify';
import { hashPlaceholder, issueTokens } from './authService';

const OTP_TTL_MIN = 10;
const OTP_MAX_ATTEMPTS = 5;

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function requestOtp(email: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = hashCode(code);
  const expiresAt = addMinutes(new Date(), OTP_TTL_MIN);
  await prisma.otpCode.updateMany({ where: { email, used: false }, data: { used: true } });
  await prisma.otpCode.create({ data: { email, codeHash, expiresAt } });
  await sendLeadEmail('Your login OTP', `Your OTP is ${code}. It expires in ${OTP_TTL_MIN} minutes.`);
}

export async function verifyOtp(email: string, code: string) {
  const record = await prisma.otpCode.findFirst({ where: { email, used: false }, orderBy: { createdAt: 'desc' } });
  if (!record) throw { status: 400, message: 'OTP not found' };
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });
    throw { status: 400, message: 'OTP expired' };
  }
  if (isAfter(new Date(), record.expiresAt)) throw { status: 400, message: 'OTP expired' };
  if (record.codeHash !== hashCode(code)) {
    const attempts = record.attempts + 1;
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts, used: attempts >= OTP_MAX_ATTEMPTS },
    });
    throw { status: 400, message: attempts >= OTP_MAX_ATTEMPTS ? 'OTP expired' : 'Invalid OTP' };
  }
  await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: email.split('@')[0], email, password: await hashPlaceholder(), role: { connect: { name: 'User' } } },
    include: { role: true },
  });
  return issueTokens(user.id, user.role.name);
}
