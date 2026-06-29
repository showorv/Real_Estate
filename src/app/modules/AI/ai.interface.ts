import { Document, Types } from 'mongoose';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// AIRecommendation -- usage log (see plan section 14)
// ---------------------------------------------------------------------------
export interface IAIRecommendation extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  propertyId?: Types.ObjectId;
  prompt: string;
  recommendedPropertyIds: Types.ObjectId[];
  recommendationText: string;
  // Named aiModel, not model -- Mongoose's Document base type already has a
  // .model() method, so a schema field literally named "model" collides
  // with it (TS2430). Same class of bug as the Express 5 req.query and Zod
  // v4 error.issues renames already logged in the build history.
  aiModel: string;
  tokensUsed?: number;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// NeighborhoodAnalysis -- get-or-generate cache, keyed by propertyId (see plan section 14)
// ---------------------------------------------------------------------------
export interface INeighborhoodAnalysis extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  analysis: string;
  aiModel: string;
  locationSnapshot: { city: string; area: string };
  generatedAt: Date;
  expiresAt: Date;
}

// ---------------------------------------------------------------------------
// Feature 1: AI Property Description Generator
// Raw structured fields, not a propertyId -- this runs *before* the listing
// is saved, while a manager is still filling out the create-listing form.
// ---------------------------------------------------------------------------
const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'land', 'commercial'] as const;
const LISTING_TYPES = ['sale', 'rent'] as const;

export const generateDescriptionSchema = z.object({
  title: z.string().min(3).max(120),
  propertyType: z.enum(PROPERTY_TYPES),
  listingType: z.enum(LISTING_TYPES),
  bedrooms: z.number().int().min(0).max(50),
  bathrooms: z.number().int().min(0).max(50),
  areaSqft: z.number().positive(),
  price: z.number().positive(),
  currency: z.string().length(3).optional(),
  city: z.string().min(1).max(80),
  area: z.string().min(1).max(80),
  amenities: z.array(z.string().min(1).max(50)).max(30).optional(),
});
export type GenerateDescriptionInput = z.infer<typeof generateDescriptionSchema>;

// ---------------------------------------------------------------------------
// Feature 2: AI Smart Recommendations
// Either propertyId ("similar to what I'm viewing") or a free-text prompt
// ("find me X" from the dashboard), or both. At least one is required.
// ---------------------------------------------------------------------------
export const getRecommendationsSchema = z
  .object({
    propertyId: z.string().min(1).optional(),
    prompt: z.string().min(3).max(300).optional(),
  })
  .refine((v) => Boolean(v.propertyId || v.prompt), {
    message: 'Provide a propertyId, a prompt, or both',
  });
export type GetRecommendationsInput = z.infer<typeof getRecommendationsSchema>;

export const recommendationHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
export type RecommendationHistoryQuery = z.infer<typeof recommendationHistoryQuerySchema>;

// The model's structured response for a single recommendation call -- kept
// separate from the request schemas above since this one shapes OpenAI's
// output, not an incoming request.
export const recommendationResponseSchema = z.object({
  recommendedPropertyIds: z.array(z.string()).max(8),
  recommendationText: z.string().min(10).max(800),
});
export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>;