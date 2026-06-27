import { Document, Types } from 'mongoose';
import { z } from 'zod';

export interface IReview extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(500),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;