import { Router } from 'express';
import { prisma } from '../prisma/client';
import { sendLeadEmail } from '../services/notify';
import { z } from 'zod';
import { leadLimiter } from '../middleware/rateLimit';
import { log } from '../utils/logger';
import { getCookie } from '../utils/cookies';
import { config } from '../config';
import { verifyAccessToken } from '../utils/jwt';

const router = Router();

const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  city: z.string().optional(),
  note: z.string().optional(),
  propertyId: z.number().int().positive().optional(),
});

router.post('/', leadLimiter, async (req, res, next) => {
  try {
    const parsed = leadSchema.parse(req.body);
    const { name, email, phone, city, note, propertyId } = parsed;
    const pid = propertyId ? Number(propertyId) : undefined;
    let userId: number | undefined;
    const accessToken = getCookie(req, config.cookies.accessTokenName);
    if (accessToken) {
      try {
        const decoded = verifyAccessToken(accessToken) as { userId?: number };
        userId = decoded.userId;
      } catch {
        userId = undefined;
      }
    }
    if (pid) {
      const property = await prisma.property.findUnique({ where: { id: pid }, select: { id: true } });
      if (!property) throw { status: 400, message: 'Property not found' };
    }
    await prisma.inquiry.create({ data: { name, email, phone, message: note || 'Lead form', propertyId: pid, userId } });
    try {
      await sendLeadEmail('New lead', `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nCity: ${city}\nNote: ${note}`);
    } catch (notifyError) {
      log.error('Lead email delivery failed', notifyError);
    }
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

export default router;
