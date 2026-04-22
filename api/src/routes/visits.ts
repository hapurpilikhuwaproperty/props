import { Router } from 'express';
import { VisitStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

const createVisitSchema = z.object({
  propertyId: z.number().int().positive(),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(1000).optional(),
});

const updateVisitSchema = z.object({
  status: z.nativeEnum(VisitStatus).optional(),
  notes: z.string().max(1000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

const isAdmin = (role: string) => role === 'Admin';
const canManageVisits = (role: string) => role === 'Admin' || role === 'Agent';

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const role = req.user!.role;
    const where = isAdmin(role)
      ? {}
      : role === 'Agent'
        ? { agentId: req.user!.id }
        : { userId: req.user!.id };

    const visits = await prisma.visit.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        property: { select: { id: true, title: true, location: true } },
        user: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(visits);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const role = req.user!.role;
    if (canManageVisits(role)) {
      return res.status(403).json({ message: 'Use a buyer account to request a site visit.' });
    }

    const parsed = createVisitSchema.parse(req.body);
    const property = await prisma.property.findUnique({
      where: { id: parsed.propertyId },
      select: { id: true, agentId: true, status: true },
    });
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (property.status === 'SOLD') return res.status(400).json({ message: 'Sold properties cannot be scheduled.' });

    const visit = await prisma.visit.create({
      data: {
        propertyId: property.id,
        userId: req.user!.id,
        agentId: property.agentId,
        scheduledAt: new Date(parsed.scheduledAt),
        notes: parsed.notes,
      },
      include: {
        property: { select: { id: true, title: true, location: true } },
        user: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(visit);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req: AuthRequest, res, next) => {
  try {
    const visitId = Number(req.params.id);
    if (!Number.isInteger(visitId) || visitId <= 0) {
      return res.status(400).json({ message: 'Invalid visit id' });
    }

    const visit = await prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) return res.status(404).json({ message: 'Visit not found' });

    const parsed = updateVisitSchema.parse(req.body);
    const role = req.user!.role;

    const isOwner = visit.userId === req.user!.id;
    const isAssignedAgent = visit.agentId === req.user!.id;
    const isAllowed = isAdmin(role) || isOwner || isAssignedAgent;
    if (!isAllowed) return res.status(403).json({ message: 'Forbidden' });

    if (role === 'User' && parsed.status) {
      return res.status(403).json({ message: 'Buyers cannot change visit workflow status.' });
    }
    if (canManageVisits(role) && parsed.rating) {
      return res.status(403).json({ message: 'Only the buyer can submit a visit rating.' });
    }

    const updated = await prisma.visit.update({
      where: { id: visitId },
      data: {
        status: parsed.status,
        notes: parsed.notes,
        rating: parsed.rating,
      },
      include: {
        property: { select: { id: true, title: true, location: true } },
        user: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
