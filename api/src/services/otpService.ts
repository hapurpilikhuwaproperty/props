import crypto from 'crypto';
import { addMinutes, isAfter } from 'date-fns';
import { prisma } from '../prisma/client.js';
import { sendLeadEmail } from './notify.js';
import { loginWithVerifiedOtp, SessionContext } from './authService.js';
import { config } from '../config.js';
import { log } from '../utils/logger.js';

type OtpChannel = 'EMAIL' | 'PHONE';

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

const normalizeIdentifier = (channel: OtpChannel, value: string) =>
  channel === 'EMAIL' ? value.trim().toLowerCase() : value.replace(/[^\d+]/g, '');

const sendOtp = async (channel: OtpChannel, identifier: string, code: string) => {
  if (channel === 'EMAIL') {
    await sendLeadEmail('Your login OTP', `Your OTP is ${code}. It expires in ${config.auth.otpTtlMinutes} minutes.`, identifier);
    return;
  }

  if (config.sms.webhookUrl) {
    const response = await fetch(config.sms.webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(config.sms.apiKey ? { authorization: `Bearer ${config.sms.apiKey}` } : {}),
      },
      body: JSON.stringify({
        to: identifier,
        message: `Your Hapur Pilkhuwa Property OTP is ${code}. It expires in ${config.auth.otpTtlMinutes} minutes.`,
      }),
    });
    if (!response.ok) throw { status: 502, message: 'SMS provider failed' };
    return;
  }

  if (config.isProduction) throw { status: 500, message: 'SMS login is not configured' };
  log.info(`SMS provider is not configured. OTP for ${identifier}: ${code}`);
};

export async function requestOtp(params: { channel: OtpChannel; identifier: string }) {
  const identifier = normalizeIdentifier(params.channel, params.identifier);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = hashCode(code);
  const expiresAt = addMinutes(new Date(), config.auth.otpTtlMinutes);

  await prisma.otpCode.updateMany({ where: { identifier, channel: params.channel, used: false }, data: { used: true } });
  await prisma.otpCode.create({
    data: {
      identifier,
      email: params.channel === 'EMAIL' ? identifier : undefined,
      channel: params.channel,
      codeHash,
      expiresAt,
    },
  });
  await sendOtp(params.channel, identifier, code);
}

export async function verifyOtp(params: { channel: OtpChannel; identifier: string; code: string }, context: SessionContext) {
  const identifier = normalizeIdentifier(params.channel, params.identifier);
  const record = await prisma.otpCode.findFirst({
    where: { identifier, channel: params.channel, used: false },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw { status: 400, message: 'OTP not found' };
  if (record.attempts >= config.auth.otpMaxAttempts) {
    await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });
    throw { status: 400, message: 'OTP expired' };
  }
  if (isAfter(new Date(), record.expiresAt)) throw { status: 400, message: 'OTP expired' };
  if (record.codeHash !== hashCode(params.code)) {
    const attempts = record.attempts + 1;
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts, used: attempts >= config.auth.otpMaxAttempts },
    });
    throw { status: 400, message: attempts >= config.auth.otpMaxAttempts ? 'OTP expired' : 'Invalid OTP' };
  }
  await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } });

  return loginWithVerifiedOtp({ channel: params.channel, identifier }, context);
}
