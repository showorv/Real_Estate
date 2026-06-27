import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';

import { requireParam } from '../../utils/requireParam';
import * as inquiryService from './inquiry.service';
import { sendResponse } from '../../utils/sendResponse';

export const createInquiry = asyncHandler(async (req: Request, res: Response) => {
  const inquiry = await inquiryService.createInquiry(req.user! as any, req.body);
  sendResponse(res,{
    statusCode: 201,
    success: true,
    message: 'Inquiry created',
    data: inquiry
  });
});

export const listInquiries = asyncHandler(async (req: Request, res: Response) => {
  const result = await inquiryService.listInquiries(req.user! as any, req.query as never);
  sendResponse(res,{
    statusCode: 200,
    success: true,
    message: 'Inquiries fetched',
    data: result.inquiries,
    meta: result.pagination
  });
});

export const updateInquiryStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = requireParam(req.params.id, 'id');
  const inquiry = await inquiryService.updateInquiryStatus(id, req.user! as any, req.body.status);
  sendResponse(res,{
    statusCode: 200,
    success: true,
    message: `Inquiry marked as ${req.body.status}`,
    data: inquiry
  });
});