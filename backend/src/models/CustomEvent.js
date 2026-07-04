import mongoose from 'mongoose';

const customEventSchema = new mongoose.Schema(
  {
    site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true, index: true },
    siteId: { type: String, required: true, index: true },

    visitorId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },

    // e.g. "button_click", "form_submit", "signup_completed"
    eventName: { type: String, required: true, index: true },

    // Free-form metadata the embedding site can attach, e.g. { buttonId: 'cta-hero', formName: 'newsletter' }
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    path: { type: String, required: true },

    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

customEventSchema.index({ siteId: 1, eventName: 1, createdAt: -1 });

export default mongoose.model('CustomEvent', customEventSchema);
