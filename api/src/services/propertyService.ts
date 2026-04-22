import { ListingSource, Prisma, VerificationLevel } from '@prisma/client';
import { prisma } from '../prisma/client';
import { canonicalLocationName, slugifyLocation } from '../utils/location';

type PropertyActor = {
  id: number;
  role: string;
};

const propertyInclude = {
  images: true,
  amenities: { include: { amenity: true } },
  agent: { select: { id: true, name: true } },
  _count: { select: { inquiries: true, favorites: true, visits: true, shortlistItems: true } },
} satisfies Prisma.PropertyInclude;

const buildTrustState = (
  data: any,
  role: string,
  current?: {
    verificationLevel: VerificationLevel;
    verified: boolean;
    listingSource: ListingSource;
    responseTimeHours: number | null;
    lastVerifiedAt: Date | null;
    description: string;
    areaSqFt: number | null;
    latitude: number | null;
    longitude: number | null;
  },
) => {
  const isAdmin = role === 'Admin';
  const verificationLevel =
    isAdmin && data.verificationLevel
      ? (data.verificationLevel as VerificationLevel)
      : current?.verificationLevel || VerificationLevel.BASIC;
  const verified = isAdmin ? (typeof data.verified === 'boolean' ? data.verified : verificationLevel === VerificationLevel.VERIFIED) : verificationLevel === VerificationLevel.VERIFIED;
  const listingSource = isAdmin
    ? ((data.listingSource as ListingSource | undefined) || current?.listingSource || ListingSource.ADMIN_IMPORT)
    : current?.listingSource || ListingSource.AGENT;
  const responseTimeHours =
    typeof data.responseTimeHours === 'number'
      ? data.responseTimeHours
      : current?.responseTimeHours ?? (role === 'Agent' ? 2 : 4);
  const lastVerifiedAt =
    isAdmin && data.lastVerifiedAt
      ? new Date(data.lastVerifiedAt)
      : verified
        ? current?.lastVerifiedAt || new Date()
        : current?.lastVerifiedAt || null;

  return { verificationLevel, verified, listingSource, responseTimeHours, lastVerifiedAt };
};

const calculateQualityScore = (input: {
  description: string;
  images: string[];
  amenities: string[];
  areaSqFt?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  verificationLevel: VerificationLevel;
  responseTimeHours?: number | null;
}) => {
  let score = 35;
  if (input.description.trim().length >= 80) score += 10;
  if (input.images.length >= 3) score += 15;
  else if (input.images.length > 0) score += 8;
  if (input.amenities.length >= 4) score += 10;
  else if (input.amenities.length > 0) score += 5;
  if (input.areaSqFt) score += 10;
  if (input.latitude != null && input.longitude != null) score += 10;
  if (input.verificationLevel === VerificationLevel.REVIEWED) score += 8;
  if (input.verificationLevel === VerificationLevel.VERIFIED) score += 15;
  if ((input.responseTimeHours ?? 999) <= 4) score += 5;
  return Math.min(100, score);
};

const serializeProperty = (property: any) => {
  const freshnessDate = property.lastVerifiedAt || property.updatedAt;
  const freshnessDays = freshnessDate
    ? Math.max(0, Math.floor((Date.now() - new Date(freshnessDate).getTime()) / (24 * 60 * 60 * 1000)))
    : null;

  return {
    ...property,
    price: Number(property.price),
    freshnessDays,
    inquiryCount: property._count?.inquiries ?? 0,
    favoriteCount: property._count?.favorites ?? 0,
    visitCount: property._count?.visits ?? 0,
    shortlistCount: property._count?.shortlistItems ?? 0,
    localityName: canonicalLocationName(property.location),
    localitySlug: slugifyLocation(property.location),
  };
};

const discoveryScore = (property: any, query: any) => {
  let score = property.qualityScore ?? 0;
  if (property.verified) score += 12;
  if (property.freshnessDays != null) score += Math.max(0, 8 - property.freshnessDays);
  score += Math.min(10, (property.shortlistCount ?? 0) * 2);
  score += Math.min(8, property.favoriteCount ?? 0);
  score += Math.min(8, (property.visitCount ?? 0) * 2);
  if (query.location && String(property.location).toLowerCase().includes(String(query.location).toLowerCase())) score += 15;
  if (query.type && property.type === query.type) score += 10;
  if (query.bedrooms && property.bedrooms >= Number(query.bedrooms)) score += 8;
  if (query.verified === 'true' && property.verified) score += 10;
  return score;
};

export const list = async (query: any) => {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 12;
  const skip = (page - 1) * pageSize;
  const where: Prisma.PropertyWhereInput = {};

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
    ];
  }
  if (query.location) where.location = { contains: query.location, mode: 'insensitive' };
  if (query.type) where.type = query.type;
  if (query.status) where.status = query.status;
  if (query.verified === 'true') where.verified = true;
  if (query.verified === 'false') where.verified = false;
  if (query.bedrooms) where.bedrooms = { gte: query.bedrooms };
  if (query.minPrice || query.maxPrice) {
    where.price = {
      gte: query.minPrice,
      lte: query.maxPrice,
    };
  }

  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    query.sort === 'price_desc'
      ? { price: 'desc' }
      : query.sort === 'price_asc'
        ? { price: 'asc' }
        : query.sort === 'quality_desc' || query.sort === 'recommended'
          ? { qualityScore: 'desc' }
          : { createdAt: 'desc' };

  const [items, total] = await Promise.all([
    prisma.property.findMany({ where, orderBy, skip, take: pageSize, include: propertyInclude }),
    prisma.property.count({ where }),
  ]);

  const serialized = items.map(serializeProperty);
  const ranked = query.sort === 'recommended'
    ? [...serialized].sort((left, right) => discoveryScore(right, query) - discoveryScore(left, query))
    : serialized;

  return { items: ranked, total, page, pageSize };
};

export const get = (id: number) =>
  prisma.property.findUnique({ where: { id }, include: propertyInclude }).then((property) => (property ? serializeProperty(property) : property));

export const create = async (user: PropertyActor, data: any) => {
  const trust = buildTrustState(data, user.role);
  const amenities = Array.isArray(data.amenities) ? data.amenities : [];
  const images = Array.isArray(data.images) ? data.images : [];
  const qualityScore =
    user.role === 'Admin' && typeof data.qualityScore === 'number'
      ? data.qualityScore
      : calculateQualityScore({
          description: data.description,
          images,
          amenities,
          areaSqFt: data.areaSqFt,
          latitude: data.latitude,
          longitude: data.longitude,
          verificationLevel: trust.verificationLevel,
          responseTimeHours: trust.responseTimeHours,
        });

  const created = await prisma.property.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      type: data.type,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      areaSqFt: data.areaSqFt,
      status: data.status || 'AVAILABLE',
      verified: trust.verified,
      verificationLevel: trust.verificationLevel,
      listingSource: trust.listingSource,
      qualityScore,
      responseTimeHours: trust.responseTimeHours,
      lastVerifiedAt: trust.lastVerifiedAt,
      agentId: user.id,
      amenities: amenities.length
        ? {
            create: amenities.map((name: string) => ({
              amenity: { connectOrCreate: { where: { name }, create: { name } } },
            })),
          }
        : undefined,
      images: images.length ? { create: images.map((url: string, idx: number) => ({ url, isCover: idx === 0 })) } : undefined,
    },
    include: propertyInclude,
  });

  return serializeProperty(created);
};

export const update = async (id: number, user: PropertyActor, data: any) => {
  const property = await prisma.property.findUnique({
    where: { id },
    include: { images: true, amenities: { include: { amenity: true } } },
  });
  if (!property) throw { status: 404, message: 'Property not found' };
  if (user.role !== 'Admin' && property.agentId !== user.id) throw { status: 403, message: 'Forbidden' };

  const amenities = Array.isArray(data.amenities) ? data.amenities : property.amenities.map((item) => item.amenity.name);
  const images = Array.isArray(data.images) ? data.images : property.images.map((image) => image.url);
  const trust = buildTrustState(
    data,
    user.role,
    {
      verificationLevel: property.verificationLevel,
      verified: property.verified,
      listingSource: property.listingSource,
      responseTimeHours: property.responseTimeHours,
      lastVerifiedAt: property.lastVerifiedAt,
      description: property.description,
      areaSqFt: property.areaSqFt,
      latitude: property.latitude,
      longitude: property.longitude,
    },
  );

  const nextDescription = data.description ?? property.description;
  const nextArea = data.areaSqFt === undefined ? property.areaSqFt : data.areaSqFt;
  const nextLatitude = data.latitude === undefined ? property.latitude : data.latitude;
  const nextLongitude = data.longitude === undefined ? property.longitude : data.longitude;
  const qualityScore =
    user.role === 'Admin' && typeof data.qualityScore === 'number'
      ? data.qualityScore
      : calculateQualityScore({
          description: nextDescription,
          images,
          amenities,
          areaSqFt: nextArea,
          latitude: nextLatitude,
          longitude: nextLongitude,
          verificationLevel: trust.verificationLevel,
          responseTimeHours: trust.responseTimeHours,
        });

  const updated = await prisma.property.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      type: data.type,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      areaSqFt: data.areaSqFt,
      status: data.status,
      verified: trust.verified,
      verificationLevel: trust.verificationLevel,
      listingSource: trust.listingSource,
      qualityScore,
      responseTimeHours: trust.responseTimeHours,
      lastVerifiedAt: trust.lastVerifiedAt,
      amenities: Array.isArray(data.amenities)
        ? {
            deleteMany: {},
            create: amenities.map((name: string) => ({
              amenity: { connectOrCreate: { where: { name }, create: { name } } },
            })),
          }
        : undefined,
      images: Array.isArray(data.images)
        ? {
            deleteMany: {},
            create: images.map((url: string, idx: number) => ({ url, isCover: idx === 0 })),
          }
        : undefined,
    },
    include: propertyInclude,
  });

  return serializeProperty(updated);
};

export const remove = async (id: number, user: PropertyActor) => {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw { status: 404, message: 'Property not found' };
  if (user.role !== 'Admin' && property.agentId !== user.id) throw { status: 403, message: 'Forbidden' };
  await prisma.property.delete({ where: { id } });
};
