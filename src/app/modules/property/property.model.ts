import { Schema, model } from 'mongoose';
import { IProperty } from './property.interface';


const propertySchema = new Schema<IProperty>(
  {
    title: { type: String, required: true, trim: true, minlength: 10, maxlength: 120 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true, minlength: 50, maxlength: 3000 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    listingType: { type: String, enum: ['sale', 'rent'], required: true },
    propertyType: {
      type: String,
      enum: ['apartment', 'house', 'villa', 'land', 'commercial'],
      required: true,
    },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    areaSqft: { type: Number, required: true, min: 1 },
    location: {
      city: { type: String, required: true },
      area: { type: String, required: true },
      address: { type: String, required: true },
      geo: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number] }, // [lng, lat]
      },
    },
    amenities: [{ type: String }],
    images: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: 'At least one image is required',
      },
    },
    aiTags: [{ type: String }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    isFeatured: { type: Boolean, default: false },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    viewsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Powers the explore-page filter/sort path: status + type filters + city + price range/sort, in one pass
propertySchema.index({ status: 1, propertyType: 1, listingType: 1, 'location.city': 1, price: 1 });

// "Near me" search -- not exposed as a feature yet, but the index costs nothing to have ready
propertySchema.index({ 'location.geo': '2dsphere' });

// Free-text search across title + description (swappable for Atlas Search later without a schema change)
propertySchema.index({ title: 'text', description: 'text' });

export const PropertyModel = model<IProperty>('Property', propertySchema);