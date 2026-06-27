import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';

import { requireParam } from '../../utils/requireParam';
import * as reviewService from './review.service';
import { sendResponse } from '../../utils/sendResponse';

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = requireParam(req.params.id, 'id');
  const review = await reviewService.createReview(propertyId, req.user! as any, req.body);
  sendResponse(res,{ statusCode: 201,success: true, message: 'Review created', data: review });
});

export const listReviewsByProperty = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = requireParam(req.params.id, 'id');
  const result = await reviewService.listReviewsByProperty(propertyId, req.query as never);
  sendResponse(res, { statusCode: 200, success: true, message: 'Reviews fetched', data: result.reviews, meta: result.pagination });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, 'id');
  await reviewService.deleteReview(id, req.user as any);
  sendResponse(res, { statusCode: 200, success: true, message: 'Review deleted' });
});