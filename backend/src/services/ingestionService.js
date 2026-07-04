import PageView from '../models/PageView.js';
import Session from '../models/Session.js';
import CustomEvent from '../models/CustomEvent.js';
import { parseUserAgent, getCountryFromIp, getClientIp } from '../utils/requestParser.js';
import { markVisitorActive, getActiveVisitorCount } from '../config/redis.js';

const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 min of inactivity = new session

/**
 * Ingests a pageview beacon from the tracking script.
 * Handles: session stitching (new vs continuing session), bounce calculation,
 * device/geo enrichment, and emits a real-time update over Socket.io.
 */
export async function ingestPageView({ req, site, body, io }) {
  const { visitorId, sessionId, url, path, referrer } = body;
  const ip = getClientIp(req);
  const { device, browser, os } = parseUserAgent(req.headers['user-agent']);
  const country = getCountryFromIp(ip);

  // Find existing active session or create a new one
  let session = await Session.findOne({ sessionId });

  const now = new Date();

  if (!session) {
    session = await Session.create({
      site: site._id,
      siteId: site.siteId,
      sessionId,
      visitorId,
      entryPage: path,
      exitPage: path,
      device,
      browser,
      os,
      country,
      referrer: referrer || '',
      startedAt: now,
      lastActivityAt: now,
      pageViewCount: 1,
      isBounce: true,
      isActive: true,
    });
  } else {
    const idleFor = now - session.lastActivityAt;

    if (idleFor > SESSION_IDLE_TIMEOUT_MS) {
      // Treat as a brand new session even though client reused the ID edge case;
      // in practice the client should generate a new sessionId, but we guard anyway.
      session.startedAt = now;
      session.pageViewCount = 1;
      session.isBounce = true;
    } else {
      session.pageViewCount += 1;
      session.isBounce = false; // more than one page view => not a bounce
    }

    session.exitPage = path;
    session.lastActivityAt = now;
    session.durationMs = now - session.startedAt;
    await session.save();
  }

  // Write the pageview event (fire-and-forget pattern, but we await for consistency)
  const pageView = await PageView.create({
    site: site._id,
    siteId: site.siteId,
    visitorId,
    sessionId,
    url,
    path,
    referrer: referrer || '',
    device,
    browser,
    os,
    country,
    createdAt: now,
  });

  // Update real-time presence in Redis
  await markVisitorActive(site.siteId, visitorId, path);

  // Push live update to any connected dashboards for this site
  if (io) {
    const activeCount = await getActiveVisitorCount(site.siteId);
    io.to(`site:${site.siteId}`).emit('pageview', {
      path,
      device,
      country,
      timestamp: now,
      activeVisitors: activeCount,
    });
  }

  return pageView;
}

/**
 * Ingests a custom event beacon (button click, form submit, etc.)
 */
export async function ingestCustomEvent({ site, body, io }) {
  const { visitorId, sessionId, eventName, metadata, path } = body;

  const event = await CustomEvent.create({
    site: site._id,
    siteId: site.siteId,
    visitorId,
    sessionId,
    eventName,
    metadata: metadata || {},
    path,
    createdAt: new Date(),
  });

  // A custom event also means the session is engaged, not a bounce
  await Session.updateOne(
    { sessionId },
    { $set: { isBounce: false, lastActivityAt: new Date() } }
  );

  if (io) {
    io.to(`site:${site.siteId}`).emit('custom_event', {
      eventName,
      path,
      metadata,
      timestamp: event.createdAt,
    });
  }

  return event;
}

/**
 * Heartbeat ping - keeps a visitor marked "active" without recording a new pageview.
 * The tracking script calls this every ~20s while the tab is open.
 */
export async function ingestHeartbeat({ site, body, io }) {
  const { visitorId, path } = body;
  await markVisitorActive(site.siteId, visitorId, path);

  if (io) {
    const activeCount = await getActiveVisitorCount(site.siteId);
    io.to(`site:${site.siteId}`).emit('visitor_count', { activeVisitors: activeCount });
  }
}
