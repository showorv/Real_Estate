import { Schema, model } from 'mongoose';
import { IAIRecommendation } from './ai.interface';

const aiRecommendationSchema = new Schema<IAIRecommendation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Set when the request was made *from* a property's detail page;
    // omitted for a general "find me X" dashboard query.
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    prompt: { type: String, required: true, trim: true },
    recommendedPropertyIds: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
    recommendationText: { type: String, required: true },
    // aiModel, not model -- see the note in ai.interface.ts (Document.model() collision)
    aiModel: { type: String, required: true },
    tokensUsed: { type: Number },
  },
  // Write-once usage log -- no updatedAt needed (mirrors refreshToken.model.ts)
  { timestamps: { createdAt: true, updatedAt: false } }
);

// "My recommendation history," newest first
aiRecommendationSchema.index({ userId: 1, createdAt: -1 });

export const AIRecommendationModel = model<IAIRecommendation>(
  'AIRecommendation',
  aiRecommendationSchema
);