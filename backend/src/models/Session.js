import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true, index: true },
    siteId: { type: String, required: true, index: true },

    sessionId: { type: String, required: true, unique: true },
    visitorId: { type: String, required: true, index: true },

    entryPage: { type: String, required: true },
    exitPage: { type: String },

    pageViewCount: { type: Number, default: 1 },
    // A session is a "bounce" if it has exactly 1 page view and no custom events
    isBounce: { type: Boolean, default: true },

    device: { type: String, enum: ['desktop', 'mobile', 'tablet', 'unknown'], default: 'unknown' },
    browser: { type: String, default: 'unknown' },
    os: { type: String, default: 'unknown' },
    country: { type: String, default: 'unknown' },
    referrer: { type: String, default: '' },

    startedAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now },
    durationMs: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true }, // closed out by a sweeper job after inactivity
  },
  { timestamps: true }
);

sessionSchema.index({ siteId: 1, startedAt: -1 });
sessionSchema.index({ siteId: 1, isActive: 1 });

export default mongoose.model('Session', sessionSchema);
