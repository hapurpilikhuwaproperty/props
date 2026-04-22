import { Router } from 'express';
import { InquiryStatus } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../prisma/client';
import { z } from 'zod';
import { buildAgentScorecard, getRecommendedProperties } from '../services/intelligenceService';

const router = Router();

const isAdmin = (role: string) => role === 'Admin';
const canManageListings = (role: string) => role === 'Admin' || role === 'Agent';
const canManageInquiries = canManageListings;
const parseIdParam = (value: string, label: string) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw { status: 400, message: `Invalid ${label} id` };
  return parsed;
};
const inquiryStatusSchema = z.object({
  status: z.nativeEnum(InquiryStatus),
});
const serializeListing = (listing: any) => {
  const freshnessDate = listing.lastVerifiedAt || listing.updatedAt;
  const freshnessDays = freshnessDate
    ? Math.max(0, Math.floor((Date.now() - new Date(freshnessDate).getTime()) / (24 * 60 * 60 * 1000)))
    : null;

  return {
    ...listing,
    price: Number(listing.price),
    inquiryCount: listing._count?.inquiries ?? 0,
    freshnessDays,
  };
};

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  verified: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { name: true } },
} as const;

router.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: publicUserSelect });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      ...user,
      role: user.role.name,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/favorites', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      include: { property: { include: { images: true } } },
    });
    res.json(favorites);
  } catch (err) {
    next(err);
  }
});

router.get('/recommendations', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (canManageListings(req.user!.role)) return res.json([]);
    const recommendations = await getRecommendedProperties(req.user!.id, 4);
    res.json(recommendations);
  } catch (err) {
    next(err);
  }
});

router.get('/scorecard', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!canManageListings(req.user!.role)) return res.status(403).json({ message: 'Only agents or admins can view agent scorecards.' });
    const scorecard = await buildAgentScorecard(req.user!.id);
    res.json(scorecard);
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [user, favoritesCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user!.id }, include: { role: true } }),
      prisma.favorite.count({ where: { userId: req.user!.id } }),
    ]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const listingWhere = isAdmin(user.role.name) ? {} : { agentId: user.id };
    const inquiryWhere = isAdmin(user.role.name)
      ? {}
      : user.role.name === 'Agent'
        ? { property: { agentId: user.id } }
        : { userId: user.id };
    const visitWhere = isAdmin(user.role.name)
      ? {}
      : user.role.name === 'Agent'
        ? { agentId: user.id }
        : { userId: user.id };
    const staleListingWhere = isAdmin(user.role.name)
      ? { updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
      : { agentId: user.id, updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    const verifiedListingWhere = isAdmin(user.role.name)
      ? { verified: true }
      : { agentId: user.id, verified: true };

    const [
      listingCount,
      inquiryCount,
      totalUsers,
      verifiedListings,
      staleListings,
      openInquiries,
      scheduledVisits,
      upcomingVisits,
      recentListings,
      recentInquiries,
      recentVisits,
    ] = await Promise.all([
      canManageListings(user.role.name) ? prisma.property.count({ where: listingWhere }) : Promise.resolve(0),
      prisma.inquiry.count({ where: inquiryWhere }),
      isAdmin(user.role.name) ? prisma.user.count() : Promise.resolve(0),
      canManageListings(user.role.name) ? prisma.property.count({ where: verifiedListingWhere }) : Promise.resolve(0),
      canManageListings(user.role.name) ? prisma.property.count({ where: staleListingWhere }) : Promise.resolve(0),
      prisma.inquiry.count({ where: { ...inquiryWhere, status: InquiryStatus.OPEN } }),
      prisma.inquiry.count({ where: { ...inquiryWhere, status: InquiryStatus.VISIT_SCHEDULED } }),
      prisma.visit.count({ where: { ...visitWhere, scheduledAt: { gte: new Date() } } }),
      canManageListings(user.role.name)
        ? prisma.property.findMany({
            where: listingWhere,
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { images: true, _count: { select: { inquiries: true } } },
          })
        : Promise.resolve([]),
      prisma.inquiry.findMany({
        where: inquiryWhere,
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          property: { select: { id: true, title: true, location: true } },
        },
      }),
      prisma.visit.findMany({
        where: visitWhere,
        orderBy: { scheduledAt: 'asc' },
        take: 5,
        include: {
          property: { select: { id: true, title: true, location: true } },
          user: { select: { id: true, name: true, email: true } },
          agent: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
      stats: {
        favorites: favoritesCount,
        inquiries: inquiryCount,
        listings: listingCount,
        users: totalUsers,
        verifiedListings,
        staleListings,
        openInquiries,
        scheduledVisits,
        upcomingVisits,
      },
      recentListings: recentListings.map(serializeListing),
      recentInquiries,
      recentVisits,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/listings', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const role = req.user!.role;
    if (!canManageListings(role)) return res.status(403).json({ message: 'Forbidden' });
    const where = isAdmin(role) ? {} : { agentId: req.user!.id };
    const listings = await prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { images: true, _count: { select: { inquiries: true } } },
    });
    res.json(listings.map(serializeListing));
  } catch (err) {
    next(err);
  }
});

router.get('/inquiries', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const role = req.user!.role;
    const where = isAdmin(role)
      ? {}
      : role === 'Agent'
        ? { property: { agentId: req.user!.id } }
        : { userId: req.user!.id };
    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        property: { select: { id: true, title: true, location: true } },
      },
    });
    res.json(inquiries);
  } catch (err) {
    next(err);
  }
});

router.patch('/inquiries/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    if (!canManageInquiries(req.user!.role)) {
      return res.status(403).json({ message: 'Only agents or admins can update inquiry status.' });
    }

    const inquiryId = Number(req.params.id);
    if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
      return res.status(400).json({ message: 'Invalid inquiry id' });
    }

    const parsed = inquiryStatusSchema.parse(req.body);
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: { property: { select: { agentId: true } } },
    });

    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    if (req.user!.role !== 'Admin' && inquiry.property?.agentId !== req.user!.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        status: parsed.status,
        lastContactedAt: parsed.status === InquiryStatus.OPEN ? null : new Date(),
      },
      include: {
        property: { select: { id: true, title: true, location: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.post('/favorites/:propertyId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const propertyId = parseIdParam(req.params.propertyId, 'property');
    const fav = await prisma.favorite.create({ data: { userId: req.user!.id, propertyId } });
    res.status(201).json(fav);
  } catch (err) {
    next(err);
  }
});

router.delete('/favorites/:propertyId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const propertyId = parseIdParam(req.params.propertyId, 'property');
    await prisma.favorite.delete({ where: { userId_propertyId: { userId: req.user!.id, propertyId } } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
