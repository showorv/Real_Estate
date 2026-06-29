import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';

import * as analyticsService from './analytics.service';
import { sendResponse } from '../../utils/sendResponse';

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const overview = await analyticsService.getOverview(req.user as any);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Analytics overview retrieved successfully',
    data: overview,
  });
});