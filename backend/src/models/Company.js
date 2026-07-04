import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // Each company can have multiple sites (e.g. main site, blog, app)
    // but we keep a primary siteId/trackingId for the simple single-site case.
    trackingId: {
      type: String,
      unique: true,
      default: () => `tk_${nanoid(16)}`,
    },

    domain: { type: String, trim: true },
    plan: { type: String, enum: ['free', 'pro', 'business'], default: 'free' },

    // Plan limits - used to gate event volume per tenant
    monthlyEventLimit: { type: Number, default: 10000 },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

companySchema.index({ trackingId: 1 });

export default mongoose.model('Company', companySchema);
