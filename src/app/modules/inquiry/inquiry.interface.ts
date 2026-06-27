import { Document, Types } from 'mongoose';
import { z } from 'zod';

export type InquiryStatus = 'pending' | 'contacted' | 'closed';

export interface IInquiry extends Document {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  userId: Types.ObjectId;
  managerId: Types.ObjectId;
  message: string;
  contactPhone: string;
  preferredDate?: Date;
  status: InquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const STATUS_VALUES = ['pending', 'contacted', 'closed'] as const;

export const createInquirySchema = z.object({
  propertyId: z.string().min(1),
  message: z.string().min(5).max(500),
  contactPhone: z.string().min(1).max(30),
  preferredDate: z.coerce.date().optional(),
});
export type CreateInquiryInput = z.infer<typeof createInquirySchema>;

export const updateInquiryStatusSchema = z.object({
  // Deliberately excludes 'pending' -- that's the system-assigned initial
  // state on creation, not something set via this action (mirrors how
  // updatePropertyStatusSchema excludes 'pending').
  status: z.enum(['contacted', 'closed']),
});
export type UpdateInquiryStatusInput = z.infer<typeof updateInquiryStatusSchema>;

export const listInquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  status: z.enum(STATUS_VALUES).optional(),
});
export type ListInquiriesQuery = z.infer<typeof listInquiriesQuerySchema>;