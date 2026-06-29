import { Schema, model } from 'mongoose';
import { INeighborhoodAnalysis } from './ai.interface';

const neighborhoodAnalysisSchema = new Schema<INeighborhoodAnalysis>({
  // unique: true is both the constraint and the cache-key index -- no
  // separate plain index on propertyId needed alongside it.
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, unique: true },
  analysis: { type: String, required: true },
  // aiModel, not model -- see the note in ai.interface.ts (Document.model() collision)
  aiModel: { type: String, required: true },
  // The property's location *at generation time*. If a manager edits the
  // address later, this won't match current property.location, which tells
  // the service to regenerate instead of serving a stale write-up for the
  // wrong place.
  locationSnapshot: {
    city: { type: String, required: true },
    area: { type: String, required: true },
  },
  generatedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});

// TTL -- Mongo auto-deletes the cache entry once it expires, no cron job needed
neighborhoodAnalysisSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const NeighborhoodAnalysisModel = model<INeighborhoodAnalysis>(
  'NeighborhoodAnalysis',
  neighborhoodAnalysisSchema
);