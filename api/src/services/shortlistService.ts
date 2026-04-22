import { nanoid } from 'nanoid';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma/client';
import { canonicalLocationName, slugifyLocation } from '../utils/location';

const propertyInclude = {
  images: true,
  amenities: { include: { amenity: true } },
  agent: { select: { id: true, name: true } },
  _count: { select: { inquiries: true, favorites: true, visits: true, shortlistItems: true } },
} satisfies Prisma.PropertyInclude;

const shortlistInclude = {
  owner: { select: { id: true, name: true, email: true } },
  collaborators: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
  items: {
    include: {
      property: { include: propertyInclude },
      comments: {
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      votes: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  },
} satisfies Prisma.ShortlistInclude;

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
    shortlistCount: property._count?.shortlistItems ?? 0,
    favoriteCount: property._count?.favorites ?? 0,
    visitCount: property._count?.visits ?? 0,
    localityName: canonicalLocationName(property.location),
    localitySlug: slugifyLocation(property.location),
  };
};

const serializeShortlist = (shortlist: any, viewerId?: number | null) => {
  const membership = viewerId
    ? shortlist.ownerId === viewerId
      ? { canEdit: true, joinedAt: shortlist.createdAt }
      : shortlist.collaborators.find((entry: any) => entry.userId === viewerId)
    : null;
  const canViewPrivateIdentity = Boolean(membership);

  return {
    id: shortlist.id,
    name: shortlist.name,
    shareToken: shortlist.shareToken,
    owner: {
      id: shortlist.owner.id,
      name: shortlist.owner.name,
      email: canViewPrivateIdentity ? shortlist.owner.email : null,
    },
    isOwner: viewerId ? shortlist.ownerId === viewerId : false,
    canEdit: Boolean(membership?.canEdit),
    collaborators: shortlist.collaborators.map((entry: any) => ({
      id: entry.user.id,
      name: entry.user.name,
      email: canViewPrivateIdentity ? entry.user.email : null,
      canEdit: entry.canEdit,
      joinedAt: entry.createdAt,
    })),
    itemCount: shortlist.items.length,
    createdAt: shortlist.createdAt,
    updatedAt: shortlist.updatedAt,
    items: shortlist.items.map((item: any) => {
      const totalVotes = item.votes.reduce((sum: number, vote: any) => sum + vote.value, 0);
      return {
        id: item.id,
        note: item.note,
        priority: item.priority,
        createdAt: item.createdAt,
        property: serializeProperty(item.property),
        votes: item.votes.map((vote: any) => ({
          id: vote.id,
          value: vote.value,
          createdAt: vote.createdAt,
          user: {
            id: vote.user.id,
            name: vote.user.name,
            email: canViewPrivateIdentity ? vote.user.email : null,
          },
        })),
        voteAverage: item.votes.length ? Number((totalVotes / item.votes.length).toFixed(1)) : null,
        myVote: viewerId ? item.votes.find((vote: any) => vote.userId === viewerId)?.value ?? null : null,
        comments: item.comments.map((comment: any) => ({
          id: comment.id,
          body: comment.body,
          createdAt: comment.createdAt,
          author: {
            id: comment.author.id,
            name: comment.author.name,
            email: canViewPrivateIdentity ? comment.author.email : null,
          },
        })),
      };
    }),
  };
};

const findAccessibleShortlist = (userId: number, shortlistId: number) =>
  prisma.shortlist.findFirst({
    where: {
      id: shortlistId,
      OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
    },
    include: shortlistInclude,
  });

const ensureShortlist = async (shortlistId: number) => {
  const shortlist = await prisma.shortlist.findUnique({
    where: { id: shortlistId },
    include: shortlistInclude,
  });
  if (!shortlist) throw { status: 404, message: 'Shortlist not found' };
  return shortlist;
};

const ensureMember = async (userId: number, shortlistId: number) => {
  const shortlist = await ensureShortlist(shortlistId);
  const collaborator = shortlist.collaborators.find((entry) => entry.userId === userId);
  if (shortlist.ownerId !== userId && !collaborator) throw { status: 403, message: 'Forbidden' };
  return { shortlist, collaborator };
};

const ensureEditable = async (userId: number, shortlistId: number) => {
  const { shortlist, collaborator } = await ensureMember(userId, shortlistId);
  if (shortlist.ownerId !== userId && !collaborator?.canEdit) {
    throw { status: 403, message: 'Shortlist access is read-only' };
  }
  return shortlist;
};

const findItem = (shortlist: any, propertyId: number) => {
  const item = shortlist.items.find((entry: any) => entry.propertyId === propertyId);
  if (!item) throw { status: 404, message: 'Shortlist item not found' };
  return item;
};

export const listForUser = async (userId: number) => {
  const shortlists = await prisma.shortlist.findMany({
    where: {
      OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
    },
    include: shortlistInclude,
    orderBy: { updatedAt: 'desc' },
  });

  return shortlists.map((shortlist) => serializeShortlist(shortlist, userId));
};

export const create = async (userId: number, name: string, propertyIds: number[]) => {
  const uniquePropertyIds = [...new Set(propertyIds)];
  const properties = await prisma.property.findMany({
    where: { id: { in: uniquePropertyIds } },
  });
  if (properties.length !== uniquePropertyIds.length) throw { status: 400, message: 'One or more properties are invalid' };

  const shortlist = await prisma.shortlist.create({
    data: {
      name,
      shareToken: nanoid(12),
      ownerId: userId,
      items: {
        create: uniquePropertyIds.map((propertyId, index) => ({
          propertyId,
          priority: Math.max(1, uniquePropertyIds.length - index),
        })),
      },
    },
    include: shortlistInclude,
  });

  return serializeShortlist(shortlist, userId);
};

export const getForUser = async (userId: number, shortlistId: number) => {
  const shortlist = await findAccessibleShortlist(userId, shortlistId);
  if (!shortlist) throw { status: 404, message: 'Shortlist not found' };
  return serializeShortlist(shortlist, userId);
};

export const getByToken = async (token: string, viewerId?: number | null) => {
  const shortlist = await prisma.shortlist.findUnique({
    where: { shareToken: token },
    include: shortlistInclude,
  });
  if (!shortlist) throw { status: 404, message: 'Shortlist not found' };
  return serializeShortlist(shortlist, viewerId);
};

export const joinByToken = async (userId: number, token: string) => {
  const shortlist = await prisma.shortlist.findUnique({ where: { shareToken: token } });
  if (!shortlist) throw { status: 404, message: 'Shortlist not found' };
  if (shortlist.ownerId !== userId) {
    await prisma.shortlistCollaborator.upsert({
      where: { shortlistId_userId: { shortlistId: shortlist.id, userId } },
      create: { shortlistId: shortlist.id, userId, canEdit: false },
      update: {},
    });
  }
  return getForUser(userId, shortlist.id);
};

export const addItem = async (userId: number, shortlistId: number, propertyId: number) => {
  await ensureEditable(userId, shortlistId);
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw { status: 404, message: 'Property not found' };

  await prisma.shortlistItem.upsert({
    where: { shortlistId_propertyId: { shortlistId, propertyId } },
    create: { shortlistId, propertyId, priority: 3 },
    update: {},
  });

  return getForUser(userId, shortlistId);
};

export const removeItem = async (userId: number, shortlistId: number, propertyId: number) => {
  const shortlist = await ensureEditable(userId, shortlistId);
  const item = findItem(shortlist, propertyId);
  await prisma.shortlistItem.delete({
    where: { id: item.id },
  });
  return getForUser(userId, shortlistId);
};

export const updateItem = async (userId: number, shortlistId: number, propertyId: number, data: { note?: string; priority?: number }) => {
  const shortlist = await ensureEditable(userId, shortlistId);
  const item = findItem(shortlist, propertyId);

  await prisma.shortlistItem.update({
    where: { id: item.id },
    data: {
      note: data.note ?? item.note,
      priority: data.priority ?? item.priority,
    },
  });

  return getForUser(userId, shortlistId);
};

export const addComment = async (userId: number, shortlistId: number, propertyId: number, body: string) => {
  const { shortlist } = await ensureMember(userId, shortlistId);
  const item = findItem(shortlist, propertyId);

  await prisma.shortlistComment.create({
    data: {
      shortlistItemId: item.id,
      authorId: userId,
      body,
    },
  });

  return getForUser(userId, shortlistId);
};

export const upsertVote = async (userId: number, shortlistId: number, propertyId: number, value: number) => {
  const { shortlist } = await ensureMember(userId, shortlistId);
  const item = findItem(shortlist, propertyId);

  await prisma.shortlistVote.upsert({
    where: {
      shortlistItemId_userId: {
        shortlistItemId: item.id,
        userId,
      },
    },
    create: {
      shortlistItemId: item.id,
      userId,
      value,
    },
    update: { value },
  });

  return getForUser(userId, shortlistId);
};
