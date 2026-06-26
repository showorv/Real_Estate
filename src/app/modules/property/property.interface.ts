import { Types } from "mongoose";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                    Enums                                   */
/* -------------------------------------------------------------------------- */

export const ListingTypeEnum = ["sale", "rent"] as const;
export const PropertyTypeEnum = [
  "apartment",
  "house",
  "villa",
  "land",
  "commercial",
] as const;

export const PropertyStatusEnum = [
  "pending",
  "approved",
  "rejected",
] as const;

/* -------------------------------------------------------------------------- */
/*                                 Interfaces                                 */
/* -------------------------------------------------------------------------- */

export interface IGeoLocation {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface ILocation {
  city: string;
  area: string;
  address: string;
  geo?: IGeoLocation;
}

export interface IProperty {
  title: string;
  slug: string;
  description: string;

  price: number;
  currency: string;

  listingType: (typeof ListingTypeEnum)[number];
  propertyType: (typeof PropertyTypeEnum)[number];

  bedrooms: number;
  bathrooms: number;
  areaSqft: number;

  location: ILocation;

  amenities: string[];
  images: string[];
  aiTags: string[];

  status: (typeof PropertyStatusEnum)[number];

  isFeatured: boolean;

  managerId: Types.ObjectId;

  ratingAvg: number;
  reviewsCount: number;
  viewsCount: number;

  createdAt?: Date;
  updatedAt?: Date;
}

/* -------------------------------------------------------------------------- */
/*                               Zod Schemas                                  */
/* -------------------------------------------------------------------------- */

const geoSchema = z.object({
  type: z.literal("Point"),
  coordinates: z
    .tuple([z.number(), z.number()])
    .optional(),
});

const locationSchema = z.object({
  city: z.string().min(1),
  area: z.string().min(1),
  address: z.string().min(1),
  geo: geoSchema.optional(),
});

export const createPropertySchema = z.object({
  title: z.string().min(10).max(120),
  description: z.string().min(50).max(3000),

  price: z.number().min(0),

  currency: z.string().default("USD"),

  listingType: z.enum(ListingTypeEnum),
  propertyType: z.enum(PropertyTypeEnum),

  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  areaSqft: z.number().min(1),

  location: locationSchema,

  amenities: z.array(z.string()).default([]),

  images: z
    .array(z.string().url())
    .min(1, "At least one image is required"),

  aiTags: z.array(z.string()).optional(),
});

export const updatePropertySchema =
  createPropertySchema.partial();

export const updatePropertyStatusSchema = z.object({
  status: z.enum(PropertyStatusEnum),
});

/* -------------------------------------------------------------------------- */
/*                               Query Schemas                                */
/* -------------------------------------------------------------------------- */

export const listPropertiesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),

  limit: z.coerce.number().min(1).max(100).default(10),

  search: z.string().optional(),

  city: z.string().optional(),

  listingType: z.enum(ListingTypeEnum).optional(),

  propertyType: z.enum(PropertyTypeEnum).optional(),

  minPrice: z.coerce.number().optional(),

  maxPrice: z.coerce.number().optional(),
  minBedrooms: z.coerce.number().optional(),

  sort: z
    .enum([
      "rating",
      "oldest",
      "price_asc",
      "price_desc",
    ])
    .optional(),
});

export const myPropertiesQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),

  status: z.enum(PropertyStatusEnum).optional(),
});

export const moderationQueueQuerySchema = z.object({
  page: z.coerce.number().default(1),

  limit: z.coerce.number().default(10),

  status: z.enum(PropertyStatusEnum).default("pending"),
});

export type PropertyStatus = z.infer<
  typeof updatePropertyStatusSchema
>["status"];

export type CreatePropertyInput = z.infer<
  typeof createPropertySchema
>;

export type UpdatePropertyInput = z.infer<
  typeof updatePropertySchema
>;

export type ListPropertiesQuery = z.infer<
  typeof listPropertiesQuerySchema
>;

export type MyPropertiesQuery = z.infer<
  typeof myPropertiesQuerySchema
>;

export type ModerationQueueQuery = z.infer<
  typeof moderationQueueQuerySchema
>;