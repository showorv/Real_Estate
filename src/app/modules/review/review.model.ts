import { Schema, model } from 'mongoose';
import { IReview } from './review.interface';

const reviewSchema = new Schema<IReview>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, minlength: 5, maxlength: 500 },
  },
  { timestamps: true }
);

// One review per user per property -- business rule enforced at the DB level,
// not just the app-level check in review.service.
reviewSchema.index({ propertyId: 1, userId: 1 }, { unique: true });

// Powers the paginated "reviews for this property, newest first" fetch.
reviewSchema.index({ propertyId: 1, createdAt: -1 });

export const ReviewModel = model<IReview>('Review', reviewSchema);