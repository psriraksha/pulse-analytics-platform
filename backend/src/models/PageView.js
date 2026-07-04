import mongoose from 'mongoose';

const pageViewSchema = new mongoose.Schema(
  {
    site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true, index: true },
    siteId: { type: String, required: true, index: true }, // denormalized for fast writes

    visitorId: { type: String, required: true, index: true }, // anonymous client-generated UUID (cookie/localStorage)
    sessionId: { type: String, required: true, index: true },

    url: { type: String, required: true },
    path: { type: String, required: true },
    referrer: { type: String, default: '' },

    // Device / browser breakdown
    device: { type: String, enum: ['desktop', 'mobile', 'tablet', 'unknown'], default: 'unknown' },
    browser: { type: String, default: 'unknown' },
    os: { type: String, default: 'unknown' },

    country: { type: String, default: 'unknown' },

    // Time on page in ms, updated via beacon on unload/navigation; null until known
    duration: { type: Number, default: null },

    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Compound indexes for the most common dashboard queries
pageViewSchema.index({ siteId: 1, createdAt: -1 });
pageViewSchema.index({ siteId: 1, sessionId: 1 });
pageViewSchema.index({ siteId: 1, path: 1, createdAt: -1 });

export default mongoose.model('PageView', pageViewSchema);
