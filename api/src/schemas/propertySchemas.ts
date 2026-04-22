import { z } from 'zod';

const propertyTypeSchema = z.enum(['APARTMENT', 'VILLA', 'HOUSE', 'STUDIO', 'PLOT', 'COMMERCIAL']);
const propertyStatusSchema = z.enum(['AVAILABLE', 'PENDING', 'SOLD']);
const verificationLevelSchema = z.enum(['BASIC', 'REVIEWED', 'VERIFIED']);
const listingSourceSchema = z.enum(['OWNER', 'AGENT', 'BUILDER', 'ADMIN_IMPORT']);

const optionalQueryString = (max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' ? value.trim() || undefined : undefined),
    z.string().max(max).optional(),
  );

const optionalQueryNumber = (min: number, max: number, integer = false) =>
  z.preprocess(
    (value) => (value === undefined || value === null || value === '' ? undefined : value),
    integer
      ? z.coerce.number().int().min(min).max(max).optional()
      : z.coerce.number().min(min).max(max).optional(),
  );

export const propertyCreateSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    price: z.number().positive(),
    location: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    type: propertyTypeSchema,
    bedrooms: z.number().int().nonnegative(),
    bathrooms: z.number().int().nonnegative(),
    areaSqFt: z.number().optional(),
    status: propertyStatusSchema.optional(),
    verified: z.boolean().optional(),
    verificationLevel: verificationLevelSchema.optional(),
    listingSource: listingSourceSchema.optional(),
    qualityScore: z.number().int().min(0).max(100).optional(),
    responseTimeHours: z.number().int().positive().max(168).optional(),
    lastVerifiedAt: z.string().datetime().optional(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string().url()).optional(),
  }),
});

export const propertyUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive().optional(),
    location: z.string().optional(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    type: propertyTypeSchema.optional(),
    bedrooms: z.number().int().nonnegative().optional(),
    bathrooms: z.number().int().nonnegative().optional(),
    areaSqFt: z.number().optional().nullable(),
    status: propertyStatusSchema.optional(),
    verified: z.boolean().optional(),
    verificationLevel: verificationLevelSchema.optional(),
    listingSource: listingSourceSchema.optional(),
    qualityScore: z.number().int().min(0).max(100).optional(),
    responseTimeHours: z.number().int().positive().max(168).optional().nullable(),
    lastVerifiedAt: z.string().datetime().optional().nullable(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string().url()).optional(),
  }),
});

export const propertyQuerySchema = z.object({
  query: z.object({
    q: optionalQueryString(120),
    location: optionalQueryString(120),
    minPrice: optionalQueryNumber(0, 1_000_000_000_000),
    maxPrice: optionalQueryNumber(0, 1_000_000_000_000),
    type: propertyTypeSchema.optional(),
    status: propertyStatusSchema.optional(),
    verified: z.enum(['true', 'false']).optional(),
    bedrooms: optionalQueryNumber(1, 20, true),
    page: optionalQueryNumber(1, 10_000, true),
    pageSize: optionalQueryNumber(1, 50, true),
    sort: z.enum(['price_asc', 'price_desc', 'quality_desc', 'recommended']).optional(),
    locale: optionalQueryString(20),
  }),
});
