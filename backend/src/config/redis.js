import Redis from 'ioredis';

let redisClient;

export function getRedisClient() {
  if (!redisClient) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('connect', () => console.log('[redis] connected:', url));
    redisClient.on('error', (err) => console.error('[redis] error:', err.message));
  }
  return redisClient;
}

// --- Real-time "who is on the site right now" helpers ---
// We track active visitors per site using a Redis Sorted Set keyed by siteId.
// Each member is a visitorId, score is the last-seen timestamp (ms).
// Visitors are considered "active" if last seen within ACTIVE_WINDOW_MS.

const ACTIVE_WINDOW_MS = 60 * 1000; // 60s heartbeat window

export async function markVisitorActive(siteId, visitorId, page) {
  const redis = getRedisClient();
  const now = Date.now();
  const key = `active_visitors:${siteId}`;
  const pageKey = `active_visitors:${siteId}:pages`;

  await redis.zadd(key, now, visitorId);
  await redis.hset(pageKey, visitorId, JSON.stringify({ page, lastSeen: now }));
  // Expire stale members lazily on read; also set a TTL safety net on the hash
  await redis.expire(pageKey, 300);
}

export async function getActiveVisitorCount(siteId) {
  const redis = getRedisClient();
  const key = `active_visitors:${siteId}`;
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  // Remove stale entries
  await redis.zremrangebyscore(key, 0, cutoff);
  return redis.zcard(key);
}

export async function getActiveVisitorDetails(siteId) {
  const redis = getRedisClient();
  const key = `active_visitors:${siteId}`;
  const pageKey = `active_visitors:${siteId}:pages`;
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  await redis.zremrangebyscore(key, 0, cutoff);

  const activeIds = await redis.zrange(key, 0, -1);
  if (activeIds.length === 0) return [];

  const pageData = await redis.hmget(pageKey, ...activeIds);
  return activeIds.map((id, i) => {
    let parsed = {};
    try {
      parsed = pageData[i] ? JSON.parse(pageData[i]) : {};
    } catch (_) {}
    return { visitorId: id, page: parsed.page || 'unknown', lastSeen: parsed.lastSeen };
  });
}

export default getRedisClient;
