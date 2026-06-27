import { InquiryModel } from './inquiry.model';

import { UserRole } from '../../constraints/userRole';
import * as propertyService from '../property/property.service';
import {
  CreateInquiryInput,
  ListInquiriesQuery,
  IInquiry,
  InquiryStatus,
} from './inquiry.interface';
import { AuthUser } from '../../constraints/user';
import { AppError } from '../../utils/apiError';
import { HTTP_STATUS } from '../../constraints/httpStatus';

interface PaginatedResult<T> {
  inquiries: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * Only an approved listing can be inquired about, and a manager can't
 * inquire on their own listing -- same shape as review.service's checks.
 * managerId is snapshotted from the property at creation time (see schema
 * note in inquiry.model.ts).
 */
export async function createInquiry(
  actor: AuthUser,
  input: CreateInquiryInput
): Promise<IInquiry> {
  const property = await propertyService.getApprovedPropertyById(input.propertyId);

  if (property.managerId.equals(actor.userId)) {
    throw new AppError(HTTP_STATUS.FORBIDDEN,'You cannot inquire about your own listing');
  }

  return InquiryModel.create({
    propertyId: property._id,
    userId: actor.userId,
    managerId: property.managerId,
    message: input.message,
    contactPhone: input.contactPhone,
    preferredDate: input.preferredDate,
  });
}

/**
 * Role-scoped: a user sees only the inquiries they submitted ("My
 * Inquiries"), a manager sees only leads against their own listings
 * ("Inquiries"), and an admin sees every inquiry on the platform.
 */
export async function listInquiries(
  actor: AuthUser,
  query: ListInquiriesQuery
): Promise<PaginatedResult<IInquiry>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;

  if (actor.role === UserRole.MANAGER) {
    filter.managerId = actor.userId;
  } else if (actor.role === UserRole.USER) {
    filter.userId = actor.userId;
  }
  // Admin: no extra scoping -- sees every inquiry.

  const [inquiries, total] = await Promise.all([
    InquiryModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('propertyId', 'title slug images')
      .populate('userId', 'name avatar email'),
    InquiryModel.countDocuments(filter),
  ]);

  return { inquiries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

/** The lead's own manager, or an admin, can move it off 'pending'. */
export async function updateInquiryStatus(
  id: string,
  actor: AuthUser,
  status: InquiryStatus
): Promise<IInquiry> {
  const inquiry = await InquiryModel.findById(id);
  if (!inquiry) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Inquiry not found');

  if (actor.role !== UserRole.ADMIN && !inquiry.managerId.equals(actor.userId)) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'You can only update inquiries on your own listings');
  }

  inquiry.status = status;
  await inquiry.save();
  return inquiry;
}