import { InquiryStatus, Prisma, VisitStatus } from '@prisma/client';
import { prisma } from '../prisma/client.js';
import { localityProfiles } from '../data/localityProfiles.js';
import { canonicalLocationName, localityAliases, slugifyLocation } from '../utils/location.js';

const propertyInclude = {
  images: true,
  amenities: { include: { amenity: true } },
  agent: { select: { id: true, name: true } },
  _count: { select: { inquiries: true, favorites: true, visits: true, shortlistItems: true } },
} satisfies Prisma.PropertyInclude;

const localityMetricSelect = {
  location: true,
  price: true,
  qualityScore: true,
  status: true,
  _count: { select: { inquiries: true, shortlistItems: true, favorites: true, visits: true } },
} satisfies Prisma.PropertySelect;

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

const average = (values: number[]) => (values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0);
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const getProfile = (slug: string) => {
  const direct = localityProfiles[slug as keyof typeof localityProfiles];
  if (direct) return direct;

  const fallbackKey = Object.keys(localityProfiles).find(
    (key) => key !== 'default' && (slug === key || slug.startsWith(`${key}-`) || slug.includes(`-${key}-`)),
  ) as keyof typeof localityProfiles | undefined;

  return (fallbackKey && localityProfiles[fallbackKey]) || localityProfiles.default;
};

export const buildAgentScorecard = async (agentId: number) => {
  const [agent, properties, inquiries, visits] = await Promise.all([
    prisma.user.findUnique({
      where: { id: agentId },
      include: { role: true },
    }),
    prisma.property.findMany({
      where: { agentId },
      include: { _count: { select: { inquiries: true, shortlistItems: true } } },
    }),
    prisma.inquiry.findMany({
      where: { property: { agentId } },
    }),
    prisma.visit.findMany({
      where: { agentId },
    }),
  ]);

  if (!agent) throw { status: 404, message: 'Agent not found' };

  const propertyCount = properties.length;
  const inquiryCount = inquiries.length;
  const verifiedListings = properties.filter((item) => item.verified).length;
  const averageQuality = average(properties.map((item) => item.qualityScore));
  const averageResponseHours = average(properties.map((item) => item.responseTimeHours ?? 0).filter(Boolean));
  const touchedInquiries = inquiries.filter((item) => item.status !== InquiryStatus.OPEN).length;
  const visitCount = visits.length;
  const completedVisits = visits.filter((item) => item.status === VisitStatus.COMPLETED).length;
  const averageVisitRating = average(visits.map((item) => item.rating ?? 0).filter(Boolean));
  const conversionRate = inquiryCount ? Math.round((visitCount / inquiryCount) * 100) : 0;
  const responsivenessScore = Math.max(0, Math.min(100, 100 - (averageResponseHours || 8) * 10));
  const shortlistMomentum = sum(properties.map((item) => item._count.shortlistItems));

  return {
    agent: {
      id: agent.id,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      role: agent.role.name,
    },
    stats: {
      propertyCount,
      verifiedListings,
      inquiryCount,
      touchedInquiries,
      visitCount,
      completedVisits,
      conversionRate,
      averageQuality,
      averageResponseHours: averageResponseHours || null,
      averageVisitRating: averageVisitRating || null,
      responsivenessScore,
      shortlistMomentum,
    },
    badges: [
      verifiedListings >= Math.max(1, Math.ceil(propertyCount * 0.5)) ? 'Trust-led inventory' : 'Verification gap to close',
      conversionRate >= 40 ? 'High visit conversion' : 'Visit conversion can improve',
      averageVisitRating >= 4 ? 'Strong on-ground experience' : 'Visit feedback still sparse',
      shortlistMomentum >= Math.max(2, propertyCount) ? 'Frequently shortlisted' : 'Needs stronger shortlist pull',
    ],
  };
};

export const listLocalityInsights = async () => {
  const properties = await prisma.property.findMany({
    select: localityMetricSelect,
  });

  const grouped = new Map<string, typeof properties>();
  for (const property of properties) {
    const slug = slugifyLocation(property.location);
    const existing = grouped.get(slug) || [];
    existing.push(property);
    grouped.set(slug, existing);
  }

  return Array.from(grouped.entries())
    .map(([slug, items]) => {
      const sample = items[0];
      const profile = getProfile(slug);
      const available = items.filter((item) => item.status === 'AVAILABLE').length;
      const averagePrice = average(items.map((item) => Number(item.price)));
      const averageQuality = average(items.map((item) => item.qualityScore));
      const inquiryVelocity = sum(items.map((item) => item._count.inquiries));
      const collaborationSignals = sum(items.map((item) => item._count.shortlistItems));
      const visitMomentum = sum(items.map((item) => item._count.visits));
      return {
        slug,
        name: canonicalLocationName(sample.location),
        headline: profile.headline,
        livabilityScore: profile.livabilityScore,
        rentalDemandScore: profile.rentalDemandScore,
        averagePrice,
        averageQuality,
        listingCount: items.length,
        availableCount: available,
        inquiryVelocity,
        collaborationSignals,
        visitMomentum,
        priceMomentum: profile.priceMomentum,
      };
    })
    .sort(
      (left, right) =>
        right.collaborationSignals - left.collaborationSignals ||
        right.inquiryVelocity - left.inquiryVelocity ||
        right.averageQuality - left.averageQuality,
    );
};

export const getLocalityInsight = async (slug: string) => {
  const distinctLocations = await prisma.property.findMany({
    select: { location: true },
    distinct: ['location'],
  });
  const matchingLocations = distinctLocations
    .map((entry) => entry.location)
    .filter((location) => slugifyLocation(location) === slug);
  if (!matchingLocations.length) throw { status: 404, message: 'Locality not found' };

  const properties = await prisma.property.findMany({
    where: { location: { in: matchingLocations } },
    include: propertyInclude,
  });

  const profile = getProfile(slug);
  const serialized = properties.map(serializeProperty);
  const averagePrice = average(serialized.map((property) => Number(property.price)));
  const averageQuality = average(serialized.map((property) => property.qualityScore ?? 0));
  const averageResponseHours = average(serialized.map((property) => property.responseTimeHours ?? 0).filter(Boolean));
  const pricePerSqFt = average(
    serialized
      .map((property) => {
        const area = property.areaSqFt ? Number(property.areaSqFt) : null;
        return area ? Math.round(Number(property.price) / area) : 0;
      })
      .filter(Boolean),
  );
  const availableCount = serialized.filter((property) => property.status === 'AVAILABLE').length;
  const verificationRate = serialized.length
    ? Math.round((serialized.filter((property) => property.verified).length / serialized.length) * 100)
    : 0;
  const collaborationSignals = sum(serialized.map((property) => property.shortlistCount ?? 0));
  const visitMomentum = sum(serialized.map((property) => property.visitCount ?? 0));
  const topAgentMap = serialized.reduce((map, property) => {
    const agentId = property.agent?.id;
    if (!agentId) return map;
    const current = map.get(agentId) || { id: agentId, name: property.agent?.name || 'Agent', listingCount: 0, averageQuality: 0 };
    current.listingCount += 1;
    current.averageQuality += property.qualityScore || 0;
    map.set(agentId, current);
    return map;
  }, new Map<number, { id: number; name: string; listingCount: number; averageQuality: number }>());

  const topAgentsRaw = [...topAgentMap.values()]
    .map((item) => ({ ...item, averageQuality: Math.round(item.averageQuality / item.listingCount) }))
    .sort((left, right) => right.averageQuality - left.averageQuality)
    .slice(0, 3);

  return {
    slug,
    name: canonicalLocationName(properties[0].location),
    headline: profile.headline,
    commuteSummary: profile.commuteSummary,
    marketPulse: profile.marketPulse,
    priceMomentum: profile.priceMomentum,
    yieldOutlook: profile.yieldOutlook,
    walkability: profile.walkability,
    livabilityScore: profile.livabilityScore,
    rentalDemandScore: profile.rentalDemandScore,
    infraSignals: profile.infraSignals,
    watchouts: profile.watchouts,
    schools: profile.schools,
    hospitals: profile.hospitals,
    transit: profile.transit,
    buyerTypes: profile.buyerTypes,
    stats: {
      listingCount: serialized.length,
      availableCount,
      averagePrice,
      averageQuality,
      averagePricePerSqFt: pricePerSqFt,
      inquiryVelocity: sum(serialized.map((property) => property.inquiryCount ?? 0)),
      collaborationSignals,
      visitMomentum,
      verificationRate,
      averageResponseHours: averageResponseHours || null,
    },
    topAgents: topAgentsRaw,
    properties: serialized.slice(0, 6),
  };
};

const scorePropertyForUser = (
  property: any,
  profile: { favoriteSlugs: Set<string>; favoriteTypes: Set<string>; medianPrice: number; preferredBedrooms: number | null },
) => {
  let score = property.qualityScore ?? 0;
  if (property.verified) score += 12;
  if (profile.favoriteSlugs.has(slugifyLocation(property.location))) score += 18;
  if (profile.favoriteTypes.has(property.type)) score += 12;
  if (profile.preferredBedrooms && property.bedrooms === profile.preferredBedrooms) score += 8;
  if (profile.medianPrice) {
    const delta = Math.abs(Number(property.price) - profile.medianPrice);
    score += Math.max(0, 20 - Math.round(delta / Math.max(profile.medianPrice, 1) * 20));
  }
  score += Math.max(0, 8 - (property.freshnessDays ?? 30));
  score += Math.min(10, (property.shortlistCount ?? 0) * 2);
  score += Math.min(8, property.favoriteCount ?? 0);
  score += Math.min(8, (property.visitCount ?? 0) * 2);

  let reason = 'High trust and strong market fit.';
  if (profile.favoriteSlugs.has(slugifyLocation(property.location))) reason = `Matches your recent activity in ${canonicalLocationName(property.location)}.`;
  else if (profile.favoriteTypes.has(property.type)) reason = `Matches the ${property.type.toLowerCase()} inventory you keep exploring.`;
  else if ((property.shortlistCount ?? 0) >= 2) reason = 'Frequently shortlisted by serious buyers in this market.';
  else if (property.verified) reason = 'Verified inventory with above-average quality.';

  return { score, reason };
};

export const getRecommendedProperties = async (userId: number, limit = 4) => {
  const [favorites, inquiries, visits, shortlistItems, properties] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId },
      include: { property: true },
    }),
    prisma.inquiry.findMany({
      where: { userId },
      include: { property: true },
    }),
    prisma.visit.findMany({
      where: { userId },
      include: { property: true },
    }),
    prisma.shortlistItem.findMany({
      where: {
        shortlist: {
          OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
        },
      },
      include: {
        property: true,
      },
    }),
    prisma.property.findMany({
      where: { status: 'AVAILABLE' },
      include: propertyInclude,
    }),
  ]);

  const history = [
    ...favorites.map((item) => item.property),
    ...inquiries.map((item) => item.property).filter(Boolean),
    ...visits.map((item) => item.property),
    ...shortlistItems.map((item) => item.property),
  ];
  const favoriteSlugs = new Set(history.filter(Boolean).flatMap((property: any) => localityAliases(property.location).map(slugifyLocation)));
  const favoriteTypes = new Set(history.filter(Boolean).map((property: any) => property.type));
  const bedroomHistogram = new Map<number, number>();
  for (const property of history.filter(Boolean) as any[]) {
    bedroomHistogram.set(property.bedrooms, (bedroomHistogram.get(property.bedrooms) || 0) + 1);
  }
  const preferredBedrooms =
    Array.from(bedroomHistogram.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
  const medianPrice = history.length ? average(history.filter(Boolean).map((property: any) => Number(property.price))) : 0;

  const serialized = properties.map(serializeProperty);
  const ranked = serialized
    .filter((property) => !history.some((item: any) => item?.id === property.id))
    .map((property) => {
      const { score, reason } = scorePropertyForUser(property, {
        favoriteSlugs,
        favoriteTypes,
        medianPrice,
        preferredBedrooms,
      });
      return {
        ...property,
        recommendationScore: score,
        recommendationReason: reason,
      };
    })
    .sort((left, right) => right.recommendationScore - left.recommendationScore)
    .slice(0, limit);

  return ranked;
};
