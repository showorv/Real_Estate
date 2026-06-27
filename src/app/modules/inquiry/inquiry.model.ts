import { Schema, model } from 'mongoose';
import { IInquiry } from './inquiry.interface';

const inquirySchema = new Schema<IInquiry>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Snapshotted from property.managerId at creation time -- so a manager's
    // leads list never needs a join, and stays correct even if a listing's
    // manager changes later.
    managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, required: true, trim: true, minlength: 5, maxlength: 500 },
    contactPhone: { type: String, required: true, trim: true },
    preferredDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'closed'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

// Manager's lead dashboard -- their leads, filterable by status
inquirySchema.index({ managerId: 1, status: 1 });

export const InquiryModel = model<IInquiry>('Inquiry', inquirySchema);