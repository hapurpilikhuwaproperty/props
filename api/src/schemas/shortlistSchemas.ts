import { z } from 'zod';

export const shortlistCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    propertyIds: z.array(z.number().int().positive()).min(1).max(4),
  }),
});

export const shortlistItemCreateSchema = z.object({
  body: z.object({
    propertyId: z.number().int().positive(),
  }),
});

export const shortlistItemUpdateSchema = z.object({
  body: z.object({
    note: z.string().max(500).optional(),
    priority: z.number().int().min(0).max(5).optional(),
  }),
});

export const shortlistCommentSchema = z.object({
  body: z.object({
    body: z.string().min(1).max(500),
  }),
});

export const shortlistVoteSchema = z.object({
  body: z.object({
    value: z.number().int().min(1).max(5),
  }),
});
