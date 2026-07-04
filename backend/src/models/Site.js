import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const siteSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true },

    // This is the public-facing ID embedded in the tracking script.
    // It's safe to expose client-side (write-only key pattern).
    siteId: {
      type: String,
      unique: true,
      default: () => `site_${nanoid(12)}`,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

siteSchema.index({ company: 1, createdAt: -1 });

export default mongoose.model('Site', siteSchema);
