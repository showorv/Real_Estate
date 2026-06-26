import crypto from 'crypto';
import slugify from 'slugify';
import { PropertyModel } from './property.model';
import { HTTP_STATUS } from "../../constraints/httpStatus";
import {
  CreatePropertyInput,
  UpdatePropertyInput,
  ListPropertiesQuery,
  IProperty,
  PropertyStatus,
} from './property.interface';
import { AppError } from '../../utils/apiError';
import { AuthUser } from '../../constraints/user';

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let attempt = 0;

  // Collision is rare (it requires the exact same slugified title), but handled
  // rather than relying on the unique index to throw a raw duplicate-key error.
  while (await PropertyModel.exists({ slug })) {
    attempt += 1;
    slug = `${base}-${crypto.randomBytes(3).toString('hex')}`;
    if (attempt > 5) break;
  }
  return slug;
}

function toGeo(lat?: number, lng?: number) {
  if (lat == null || lng == null) return undefined;
  return { type: 'Point' as const, coordinates: [lng, lat] as [number, number] };
}

function buildBaseFilter(query: ListPropertiesQuery) {
  const filter: Record<string, unknown> = {};
  if (query.city) filter['location.city'] = { $regex: query.city, $options: 'i' };
  if (query.propertyType) filter.propertyType = query.propertyType;
  if (query.listingType) filter.listingType = query.listingType;
  if (query.minBedrooms != null) filter.bedrooms = { $gte: query.minBedrooms };
  if (query.minPrice != null || query.maxPrice != null) {
    const price: Record<string, number> = {};
    if (query.minPrice != null) price.$gte = query.minPrice;
    if (query.maxPrice != null) price.$lte = query.maxPrice;
    filter.price = price;
  }
  if (query.search) filter.$text = { $search: query.search };
  return filter;
}

function buildSort(sort?: ListPropertiesQuery['sort']): Record<string, 1 | -1> {
  switch (sort) {
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    case 'rating':
      return { ratingAvg: -1 };
    case 'oldest':
      return { createdAt: 1 };
    default:
      return { createdAt: -1 }; // 'newest'
  }
}

export async function createProperty(
  managerId: string,
  input: CreatePropertyInput
): Promise<IProperty> {
  const slug = await generateUniqueSlug(input.title);

  return PropertyModel.create({
    ...input,
    slug,
    managerId,
    status: 'pending',
    location: {
      city: input.location.city,
      area: input.location.area,
      address: input.location.address,
    //   geo: toGeo(input.location.lat, input.location.lng),
    },
  });
}

interface PaginatedResult<T> {
  properties: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** Public explore page -- approved listings only, regardless of who's asking. */
export async function listProperties(query: ListPropertiesQuery): Promise<PaginatedResult<IProperty>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;
  const filter = { ...buildBaseFilter(query), status: 'approved' as const };

  const [properties, total] = await Promise.all([
    PropertyModel.find(filter)
      .sort(buildSort(query.sort))
      .skip((page - 1) * limit)
      .limit(limit),
    PropertyModel.countDocuments(filter),
  ]);

  return { properties, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

/** Manager's own dashboard -- every status, scoped to their own listings only. */
export async function getMyProperties(
  managerId: string,
  query: ListPropertiesQuery & { status?: PropertyStatus }
): Promise<PaginatedResult<IProperty>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;
  const filter: Record<string, unknown> = { ...buildBaseFilter(query), managerId };
  if (query.status) filter.status = query.status;

  const [properties, total] = await Promise.all([
    PropertyModel.find(filter)
      .sort(buildSort(query.sort))
      .skip((page - 1) * limit)
      .limit(limit),
    PropertyModel.countDocuments(filter),
  ]);

  return { properties, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

/** Admin moderation queue -- defaults to 'pending' since that's the actionable list; can be widened via ?status=. */
export async function getModerationQueue(query: {
  page?: number;
  limit?: number;
  status?: PropertyStatus;
}): Promise<PaginatedResult<IProperty>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const filter = { status: query.status ?? 'pending' };

  const [properties, total] = await Promise.all([
    PropertyModel.find(filter)
      .sort({ createdAt: 1 }) // oldest-pending-first -- the longest-waiting listing gets reviewed first
      .skip((page - 1) * limit)
      .limit(limit),
    PropertyModel.countDocuments(filter),
  ]);

  return { properties, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

/**
 * Public detail page. A pending/rejected listing 404s for anyone except its
 * owner or an admin -- returning 404 rather than 403 so we don't leak the
 * existence of a not-yet-approved listing to an unrelated visitor.
 * Increments the view counter, but only for genuine third-party views.
 */
export async function getPropertyBySlug(
  slug: string,
  viewer?: AuthUser
): Promise<IProperty> {
  const property = await PropertyModel.findOne({ slug });
  if (!property) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Property not found');

  const isOwner = Boolean(viewer && property.managerId.equals(viewer.userId));
  const isAdmin = viewer?.role === 'admin';

  if (property.status !== 'approved' && !isOwner && !isAdmin) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Property not found');
  }

  if (!isOwner && !isAdmin) {
    property.viewsCount += 1;
    await property.save();
  }

  return property;
}

export async function updateProperty(
  id: string,
  actor: AuthUser,
  input: UpdatePropertyInput
): Promise<IProperty> {
  const property = await PropertyModel.findById(id);
  if (!property) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Property not found');

  if (actor.role !== 'admin' && !property.managerId.equals(actor.userId)) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'You can only edit your own listings');
  }

  const { location, ...rest } = input;
  Object.assign(property, rest);

  if (location) {
    property.location = {
      city: location.city ?? property.location.city,
      area: location.area ?? property.location.area,
      address: location.address ?? property.location.address,
      geo: property.location.geo,
    };
  }

  // Editing the content of an already-approved listing sends it back to
  // moderation -- an "approved" stamp shouldn't silently keep covering
  // content nobody has actually re-reviewed. Admin edits are exempt since
  // the admin *is* the approving authority.
  if (property.status === 'approved' && actor.role !== 'admin') {
    property.status = 'pending';
  }

  await property.save();
  return property;
}

export async function updatePropertyStatus(
  id: string,
  status: 'approved' | 'rejected'
): Promise<IProperty> {
  const property = await PropertyModel.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true, runValidators: true }
  );
  if (!property) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Property not found');
  return property;
}

export async function deleteProperty(id: string, actor: AuthUser): Promise<void> {
  const property = await PropertyModel.findById(id);
  if (!property) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Property not found');

  if (actor.role !== 'admin' && !property.managerId.equals(actor.userId)) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'You can only delete your own listings');
  }

  await property.deleteOne();
  // TODO (Phase 1.5 / 1.6): once Review and Inquiry models exist, cascade-delete
  // their documents for this propertyId here too -- otherwise they're orphaned.
}

/** Same city + type first; falls back to type-only if that's too thin, rather than returning an empty section. */
export async function getRelatedProperties(propertyId: string, limit = 4): Promise<IProperty[]> {
  const property = await PropertyModel.findById(propertyId);
  if (!property) throw new AppError(HTTP_STATUS.NOT_FOUND, 'Property not found');

  const baseExclude = { _id: { $ne: property._id }, status: 'approved' as const };

  const related = await PropertyModel.find({
    ...baseExclude,
    propertyType: property.propertyType,
    'location.city': property.location.city,
  })
    .sort({ ratingAvg: -1, createdAt: -1 })
    .limit(limit);

  if (related.length >= limit) return related;

  const more = await PropertyModel.find({
    ...baseExclude,
    propertyType: property.propertyType,
    _id: { $nin: [property._id, ...related.map((p) => p._id)] },
  })
    .sort({ ratingAvg: -1, createdAt: -1 })
    .limit(limit - related.length);

  return [...related, ...more];
}