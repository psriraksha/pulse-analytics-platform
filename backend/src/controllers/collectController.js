import { ingestPageView, ingestCustomEvent, ingestHeartbeat } from '../services/ingestionService.js';

// req.app.get('io') is set in server.js so controllers can emit real-time events
export async function collectPageView(req, res) {
  try {
    const io = req.app.get('io');
    await ingestPageView({ req, site: req.site, body: req.body, io });
    res.status(204).end(); // No content - tracking scripts don't need a payload back
  } catch (err) {
    console.error('[collectPageView] error:', err.message);
    res.status(500).json({ error: 'Failed to record pageview' });
  }
}

export async function collectCustomEvent(req, res) {
  try {
    const io = req.app.get('io');
    const { eventName } = req.body;

    if (!eventName) {
      return res.status(400).json({ error: 'eventName is required' });
    }

    await ingestCustomEvent({ site: req.site, body: req.body, io });
    res.status(204).end();
  } catch (err) {
    console.error('[collectCustomEvent] error:', err.message);
    res.status(500).json({ error: 'Failed to record event' });
  }
}

export async function collectHeartbeat(req, res) {
  try {
    const io = req.app.get('io');
    await ingestHeartbeat({ site: req.site, body: req.body, io });
    res.status(204).end();
  } catch (err) {
    console.error('[collectHeartbeat] error:', err.message);
    res.status(500).json({ error: 'Failed to record heartbeat' });
  }
}
