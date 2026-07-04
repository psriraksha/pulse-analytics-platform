import PageView from '../models/PageView.js';
import Session from '../models/Session.js';
import CustomEvent from '../models/CustomEvent.js';

function dateRangeFilter(siteId, startDate, endDate) {
  return {
    siteId,
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  };
}

export async function getOverviewStats(siteId, startDate, endDate) {
  const pvFilter = dateRangeFilter(siteId, startDate, endDate);
  const sessionFilter = {
    siteId,
    startedAt: { $gte: startDate, $lte: endDate },
  };

  const [totalPageViews, sessionStats, uniqueVisitors] = await Promise.all([
    PageView.countDocuments(pvFilter),

    Session.aggregate([
      { $match: sessionFilter },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          bounces: { $sum: { $cond: ['$isBounce', 1, 0] } },
          avgDuration: { $avg: '$durationMs' },
        },
      },
    ]),

    PageView.distinct('visitorId', pvFilter),
  ]);

  const stats = sessionStats[0] || { totalSessions: 0, bounces: 0, avgDuration: 0 };
  const bounceRate = stats.totalSessions > 0 ? (stats.bounces / stats.totalSessions) * 100 : 0;

  return {
    totalPageViews,
    totalSessions: stats.totalSessions,
    uniqueVisitors: uniqueVisitors.length,
    bounceRate: Math.round(bounceRate * 10) / 10,
    avgSessionDurationMs: Math.round(stats.avgDuration || 0),
  };
}

export async function getPageViewsTimeSeries(siteId, startDate, endDate, granularity = 'day') {
  const dateFormat = granularity === 'hour' ? '%Y-%m-%dT%H:00:00' : '%Y-%m-%d';

  const results = await PageView.aggregate([
    { $match: dateRangeFilter(siteId, startDate, endDate) },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
        views: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$visitorId' },
      },
    },
    {
      $project: {
        date: '$_id',
        views: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' },
        _id: 0,
      },
    },
    { $sort: { date: 1 } },
  ]);

  return results;
}

export async function getDeviceBreakdown(siteId, startDate, endDate) {
  return PageView.aggregate([
    { $match: dateRangeFilter(siteId, startDate, endDate) },
    { $group: { _id: '$device', count: { $sum: 1 } } },
    { $project: { device: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);
}

export async function getBrowserBreakdown(siteId, startDate, endDate) {
  return PageView.aggregate([
    { $match: dateRangeFilter(siteId, startDate, endDate) },
    { $group: { _id: '$browser', count: { $sum: 1 } } },
    { $project: { browser: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
}

export async function getTopPages(siteId, startDate, endDate, limit = 10) {
  return PageView.aggregate([
    { $match: dateRangeFilter(siteId, startDate, endDate) },
    { $group: { _id: '$path', views: { $sum: 1 } } },
    { $project: { path: '$_id', views: 1, _id: 0 } },
    { $sort: { views: -1 } },
    { $limit: limit },
  ]);
}

export async function getTopReferrers(siteId, startDate, endDate, limit = 10) {
  return Session.aggregate([
    {
      $match: {
        siteId,
        startedAt: { $gte: startDate, $lte: endDate },
        referrer: { $ne: '' },
      },
    },
    { $group: { _id: '$referrer', count: { $sum: 1 } } },
    { $project: { referrer: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
}

export async function getCountryBreakdown(siteId, startDate, endDate) {
  return PageView.aggregate([
    { $match: dateRangeFilter(siteId, startDate, endDate) },
    { $group: { _id: '$country', count: { $sum: 1 } } },
    { $project: { country: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
    { $limit: 15 },
  ]);
}

export async function getTopCustomEvents(siteId, startDate, endDate, limit = 10) {
  return CustomEvent.aggregate([
    { $match: dateRangeFilter(siteId, startDate, endDate) },
    { $group: { _id: '$eventName', count: { $sum: 1 } } },
    { $project: { eventName: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
}

/**
 * Bundles everything the main dashboard view needs into one call,
 * run in parallel to minimize total latency.
 */
export async function getFullDashboardData(siteId, startDate, endDate) {
  const [
    overview,
    timeSeries,
    deviceBreakdown,
    browserBreakdown,
    topPages,
    topReferrers,
    countryBreakdown,
    topEvents,
  ] = await Promise.all([
    getOverviewStats(siteId, startDate, endDate),
    getPageViewsTimeSeries(siteId, startDate, endDate),
    getDeviceBreakdown(siteId, startDate, endDate),
    getBrowserBreakdown(siteId, startDate, endDate),
    getTopPages(siteId, startDate, endDate),
    getTopReferrers(siteId, startDate, endDate),
    getCountryBreakdown(siteId, startDate, endDate),
    getTopCustomEvents(siteId, startDate, endDate),
  ]);

  return {
    overview,
    timeSeries,
    deviceBreakdown,
    browserBreakdown,
    topPages,
    topReferrers,
    countryBreakdown,
    topEvents,
  };
}
