import {
  getFullDashboardData,
  getOverviewStats,
  getPageViewsTimeSeries,
} from '../services/analyticsService.js';
import { getActiveVisitorCount, getActiveVisitorDetails } from '../config/redis.js';

function parseDateRange(req) {
  const { startDate, endDate, range } = req.query;

  if (startDate && endDate) {
    return { start: new Date(startDate), end: new Date(endDate) };
  }

  // Convenience presets: 7d, 30d, 90d
  const end = new Date();
  const start = new Date();
  const days = range === '90d' ? 90 : range === '7d' ? 7 : 30;
  start.setDate(start.getDate() - days);

  return { start, end };
}

export async function getDashboard(req, res) {
  try {
    const { start, end } = parseDateRange(req);
    const data = await getFullDashboardData(req.site.siteId, start, end);
    res.json(data);
  } catch (err) {
    console.error('[getDashboard] error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getOverview(req, res) {
  try {
    const { start, end } = parseDateRange(req);
    const data = await getOverviewStats(req.site.siteId, start, end);
    res.json(data);
  } catch (err) {
    console.error('[getOverview] error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTimeSeries(req, res) {
  try {
    const { start, end } = parseDateRange(req);
    const granularity = req.query.granularity === 'hour' ? 'hour' : 'day';
    const data = await getPageViewsTimeSeries(req.site.siteId, start, end, granularity);
    res.json({ data });
  } catch (err) {
    console.error('[getTimeSeries] error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getLiveVisitors(req, res) {
  try {
    const count = await getActiveVisitorCount(req.site.siteId);
    const details = await getActiveVisitorDetails(req.site.siteId);
    res.json({ activeVisitors: count, details });
  } catch (err) {
    console.error('[getLiveVisitors] error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}
