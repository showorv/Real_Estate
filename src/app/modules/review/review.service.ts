import { ReviewModel } from './review.model';

import { UserRole } from '../../constraints/userRole';
import * as propertyService from '../property/property.service';
import { CreateReviewInput, ListReviewsQuery, IReview } from './review.interface';
import { AuthUser } from '../../constraints/user';
import { AppError } from '../../utils/apiError';
import { HTTP_STATUS } from '../../constraints/httpStatus';

interface PaginatedResult<T> {
  reviews: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * Only an approved listing can be reviewed, and a user can't review their
 * own listing or review the same property twice. The duplicate check here
 * gives a clear 409; the unique index on the model is the DB-level backstop
 * for the race-condition case.
 */
export async function createReview(
  propertyId: string,
  actor: AuthUser,
  input: CreateReviewInput
): Promise<IReview> {
  const property = await propertyService.getApprovedPropertyById(propertyId);

  if (property.managerId.equals(actor.userId)) {
    throw new  AppError(HTTP_STATUS.FORBIDDEN,'You cannot review your own listing');
  }

  const existing = await ReviewModel.findOne({ propertyId, userId: actor.userId });
  if (existing) throw new AppError(HTTP_STATUS.CONFLICT, 'You have already reviewed this property');

  const review = await ReviewModel.create({ propertyId, userId: actor.userId, ...input });
  await propertyService.syncRatingStats(propertyId);
  return review;
}

/** Public reviews list for a property's detail page -- newest first, reviewer name/avatar attached. */
export async function listReviewsByProperty(
  propertyId: string,
  query: ListReviewsQuery
): Promise<PaginatedResult<IReview>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const filter = { propertyId };

  const [reviews, total] = await Promise.all([
    ReviewModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name avatar'),
    ReviewModel.countDocuments(filter),
  ]);

  return { reviews, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

/** Owner or admin only. Re-syncs the property's cached rating after removal. */
export async function deleteReview(id: string, actor: AuthUser): Promise<void> {
  const review = await ReviewModel.findById(id);
  if (!review) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Review not found');

  if (actor.role !== UserRole.ADMIN && !review.userId.equals(actor.userId)) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'You can only delete your own review');
  }

  const propertyId = review.propertyId.toString();
  await review.deleteOne();
  await propertyService.syncRatingStats(propertyId);
}