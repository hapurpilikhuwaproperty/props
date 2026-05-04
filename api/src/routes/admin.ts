import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { prisma } from '../prisma/client.js';
import { z } from 'zod';
import { setSellerApproval } from '../services/authService.js';

const router = Router();
const roleSchema = z.object({
  role: z.enum(['Admin', 'Seller', 'Guest', 'Agent', 'User']),
});
const sellerApprovalSchema = z.object({
  approved: z.boolean(),
});
const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  verified: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  sellerVerificationStatus: true,
  sellerVerifiedAt: true,
  mfaEnabled: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true } },
} as const;

router.use(requireAuth, requireRole(['Admin']));

router.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ select: adminUserSelect });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ message: 'Invalid user id' });
    const parsed = roleSchema.parse(req.body);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: { connect: { name: parsed.role } } },
      select: adminUserSelect,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id/seller-approval', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ message: 'Invalid user id' });
    const parsed = sellerApprovalSchema.parse(req.body);
    await setSellerApproval(userId, parsed.approved);
    const updated = await prisma.user.findUnique({ where: { id: userId }, select: adminUserSelect });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
