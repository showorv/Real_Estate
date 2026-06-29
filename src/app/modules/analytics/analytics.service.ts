import { Types } from 'mongoose';

import { PropertyModel } from '../property/property.model';
import { ReviewModel } from '../review/review.model';
import { InquiryModel } from '../inquiry/inquiry.model';


import { UserRole } from '../../constraints/userRole';
import { AuthUser } from '../../constraints/user';
import { User } from '../user/user.model';
import { AIRecommendationModel } from '../AI/recomendatiion.model';

interface UserOverview {
  scope: 'user';
  reviewsWritten: number;
  inquiriesSubmitted: number;
  aiRecommendationsUsed: number;
}

interface ManagerOverview {
  scope: 'manager';
  totalListings: number;
  listingsByStatus: { pending: number; approved: number; rejected: number };
  totalViews: number;
  totalReviews: number;
  averageRating: number;
  totalInquiries: number;
  inquiriesByStatus: { pending: number; contacted: number; closed: number };
}

interface AdminOverview {
  scope: 'admin';
  users: { total: number; active: number; byRole: { user: number; manager: number; admin: number } };
  properties: { total: number; byStatus: { pending: number; approved: number; rejected: number } };
  reviews: { total: number };
  inquiries: { total: number; byStatus: { pending: number; contacted: number; closed: number } };
  aiRecommendations: { total: number };
}

export type AnalyticsOverview = UserOverview | ManagerOverview | AdminOverview;

/**
 * One endpoint, three response shapes -- matches the locked API surface
 * exactly (a single GET /analytics/overview, "role-scoped") rather than
 * splitting into separate per-role routes.
 */
export async function getOverview(actor: AuthUser): Promise<AnalyticsOverview> {
  if (actor.role === UserRole.ADMIN) return getAdminOverview();
  if (actor.role === UserRole.MANAGER) return getManagerOverview(actor.userId);
  return getUserOverview(actor.userId);
}

/**
 * A user's own activity summary -- powers the "Overview" dashboard page.
 * Deliberately doesn't include a "saved properties" count: that data model
 * doesn't exist yet (favorites was descoped after the User refactor, see
 * the plan's known-gaps list). A fabricated zero would be worse than simply
 * not claiming to track it.
 */
async function getUserOverview(userId: string): Promise<UserOverview> {
  const [reviewsWritten, inquiriesSubmitted, aiRecommendationsUsed] = await Promise.all([
    ReviewModel.countDocuments({ userId }),
    InquiryModel.countDocuments({ userId }),
    AIRecommendationModel.countDocuments({ userId }),
  ]);

  return { scope: 'user', reviewsWritten, inquiriesSubmitted, aiRecommendationsUsed };
}

/** A manager's own listings plus the leads against them -- the "Analytics" dashboard page. */
async function getManagerOverview(managerId: string): Promise<ManagerOverview> {
  const managerObjectId = new Types.ObjectId(managerId);

  const [
    totalListings,
    pending,
    approved,
    rejected,
    listingTotals,
    totalInquiries,
    inquiriesPending,
    inquiriesContacted,
    inquiriesClosed,
  ] = await Promise.all([
    PropertyModel.countDocuments({ managerId }),
    PropertyModel.countDocuments({ managerId, status: 'pending' }),
    PropertyModel.countDocuments({ managerId, status: 'approved' }),
    PropertyModel.countDocuments({ managerId, status: 'rejected' }),
    PropertyModel.aggregate([
      { $match: { managerId: managerObjectId } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$viewsCount' },
          totalReviews: { $sum: '$reviewsCount' },
          // Weighted by each listing's own review count, not a flat average
          // of per-listing ratingAvg values -- a 5-star listing with one
          // review shouldn't count the same as a 4.5-star listing with 200.
          weightedRatingSum: { $sum: { $multiply: ['$ratingAvg', '$reviewsCount'] } },
        },
      },
    ]),
    InquiryModel.countDocuments({ managerId }),
    InquiryModel.countDocuments({ managerId, status: 'pending' }),
    InquiryModel.countDocuments({ managerId, status: 'contacted' }),
    InquiryModel.countDocuments({ managerId, status: 'closed' }),
  ]);

  const totals = listingTotals[0];
  const totalViews = totals?.totalViews ?? 0;
  const totalReviews = totals?.totalReviews ?? 0;
  const averageRating =
    totalReviews > 0 ? Math.round((totals.weightedRatingSum / totalReviews) * 10) / 10 : 0;

  return {
    scope: 'manager',
    totalListings,
    listingsByStatus: { pending, approved, rejected },
    totalViews,
    totalReviews,
    averageRating,
    totalInquiries,
    inquiriesByStatus: {
      pending: inquiriesPending,
      contacted: inquiriesContacted,
      closed: inquiriesClosed,
    },
  };
}

/** Platform-wide totals -- the admin's "Platform Analytics" dashboard page. */
async function getAdminOverview(): Promise<AdminOverview> {
  const [
    totalUsers,
    activeUsers,
    usersByRole,
    totalProperties,
    pendingProperties,
    approvedProperties,
    rejectedProperties,
    totalReviews,
    totalInquiries,
    inquiriesPending,
    inquiriesContacted,
    inquiriesClosed,
    totalAIRecommendations,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    User.aggregate<{ _id: UserRole; count: number }>([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]),
    PropertyModel.countDocuments({}),
    PropertyModel.countDocuments({ status: 'pending' }),
    PropertyModel.countDocuments({ status: 'approved' }),
    PropertyModel.countDocuments({ status: 'rejected' }),
    ReviewModel.countDocuments({}),
    InquiryModel.countDocuments({}),
    InquiryModel.countDocuments({ status: 'pending' }),
    InquiryModel.countDocuments({ status: 'contacted' }),
    InquiryModel.countDocuments({ status: 'closed' }),
    AIRecommendationModel.countDocuments({}),
  ]);

  const byRole = { user: 0, manager: 0, admin: 0 };
  for (const row of usersByRole) {
    if (row._id in byRole) byRole[row._id as keyof typeof byRole] = row.count;
  }

  return {
    scope: 'admin',
    users: { total: totalUsers, active: activeUsers, byRole },
    properties: {
      total: totalProperties,
      byStatus: { pending: pendingProperties, approved: approvedProperties, rejected: rejectedProperties },
    },
    reviews: { total: totalReviews },
    inquiries: {
      total: totalInquiries,
      byStatus: { pending: inquiriesPending, contacted: inquiriesContacted, closed: inquiriesClosed },
    },
    aiRecommendations: { total: totalAIRecommendations },
  };
}