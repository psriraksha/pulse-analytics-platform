import Site from '../models/Site.js';
import { getRedisClient } from '../config/redis.js';

const CACHE_TTL_SECONDS = 300;

// Validates the incoming siteId from the tracking script (collect.js)
// and attaches the resolved Site document (cached in Redis) to req.site.
export async function resolveSite(req, res, next) {
  try {
    const siteId = req.body.siteId || req.query.siteId;

    if (!siteId) {
      return res.status(400).json({ error: 'siteId is required' });
    }

    const redis = getRedisClient();
    const cacheKey = `site_cache:${siteId}`;

    let siteData = await redis.get(cacheKey);

    if (siteData) {
      req.site = JSON.parse(siteData);
    } else {
      const site = await Site.findOne({ siteId, isActive: true }).lean();

      if (!site) {
        return res.status(404).json({ error: 'Unknown or inactive site' });
      }

      req.site = site;
      await redis.set(cacheKey, JSON.stringify(site), 'EX', CACHE_TTL_SECONDS);
    }

    next();
  } catch (err) {
    console.error('[resolveSite] error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
