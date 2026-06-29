import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';

import { requireParam } from '../../utils/requireParam';
import * as aiService from './ai.service';
import { sendResponse } from '../../utils/sendResponse';

export const generateDescription = asyncHandler(async (req: Request, res: Response) => {
  const description = await aiService.generateDescription(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Description generated',
    data: { description },      
  });
});

export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const result = await aiService.getRecommendations(req.user! as any, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Recommendations generated',
    data: result
  });
});

export const getRecommendationHistory = asyncHandler(async (req: Request, res: Response) => {
  const result = await aiService.getRecommendationHistory(req.user! as any, req.query as never);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Recommendation history fetched',
    data: result.history,
    meta: result.pagination
  });
});

export const getNeighborhoodAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = requireParam(req.params.id, 'id');
  const analysis = await aiService.getNeighborhoodAnalysis(propertyId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Neighborhood analysis fetched',
    data: { analysis }
  });
});