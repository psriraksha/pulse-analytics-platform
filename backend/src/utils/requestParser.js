import { UAParser } from 'ua-parser-js';
import geoip from 'geoip-lite';

export function parseUserAgent(uaString) {
  const parser = new UAParser(uaString);
  const result = parser.getResult();

  let device = 'desktop';
  if (result.device.type === 'mobile') device = 'mobile';
  else if (result.device.type === 'tablet') device = 'tablet';

  return {
    device,
    browser: result.browser.name || 'unknown',
    os: result.os.name || 'unknown',
  };
}

export function getCountryFromIp(ip) {
  if (!ip || ip === '::1' || ip === '127.0.0.1') return 'unknown';
  try {
    // Strip IPv6 prefix if present, e.g. ::ffff:1.2.3.4
    const cleanIp = ip.replace('::ffff:', '');
    const geo = geoip.lookup(cleanIp);
    return geo?.country || 'unknown';
  } catch (_) {
    return 'unknown';
  }
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip;
}
