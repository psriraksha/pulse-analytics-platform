import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectMongo } from '../src/config/db.js';
import Company from '../src/models/Company.js';
import Site from '../src/models/Site.js';
import PageView from '../src/models/PageView.js';
import Session from '../src/models/Session.js';
import CustomEvent from '../src/models/CustomEvent.js';
import { nanoid } from 'nanoid';

const DEMO_EMAIL = 'demo@example.com';
const PAGES = ['/', '/pricing', '/features', '/blog/intro-to-saas', '/contact', '/signup'];
const DEVICES = ['desktop', 'mobile', 'tablet'];
const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge'];
const OSES = ['Windows', 'macOS', 'iOS', 'Android', 'Linux'];
const COUNTRIES = ['US', 'IN', 'GB', 'DE', 'BR', 'CA'];
const REFERRERS = ['https://google.com', 'https://twitter.com', '', 'https://producthunt.com'];
const EVENT_NAMES = ['signup_clicked', 'pricing_viewed', 'demo_requested', 'newsletter_signup'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  await connectMongo();

  let company = await Company.findOne({ email: DEMO_EMAIL });

  if (!company) {
    const hashedPassword = await bcrypt.hash('demo1234', 12);
    company = await Company.create({
      name: 'Demo Inc.',
      email: DEMO_EMAIL,
      password: hashedPassword,
      domain: 'demoinc.com',
      plan: 'pro',
    });
    console.log('Created demo company:', company.email);
  }

  let site = await Site.findOne({ company: company._id });
  if (!site) {
    site = await Site.create({
      company: company._id,
      name: 'Demo Inc. - Main Site',
      domain: 'demoinc.com',
    });
    console.log('Created demo site:', site.siteId);
  }

  console.log('Clearing old demo analytics data...');
  await PageView.deleteMany({ siteId: site.siteId });
  await Session.deleteMany({ siteId: site.siteId });
  await CustomEvent.deleteMany({ siteId: site.siteId });

  console.log('Generating synthetic analytics data for the last 30 days...');

  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  const sessionsToCreate = [];
  const pageViewsToCreate = [];
  const eventsToCreate = [];

  for (let i = 0; i < 600; i++) {
    const startedAt = new Date(now - Math.random() * THIRTY_DAYS_MS);
    const sessionId = nanoid(20);
    const visitorId = nanoid(16);
    const device = pick(DEVICES);
    const browser = pick(BROWSERS);
    const os = pick(OSES);
    const country = pick(COUNTRIES);
    const referrer = pick(REFERRERS);

    const pageViewCount = Math.random() < 0.4 ? 1 : Math.floor(Math.random() * 5) + 2;
    const isBounce = pageViewCount === 1;
    const durationMs = isBounce ? Math.random() * 10000 : Math.random() * 300000 + 10000;

    let entryPage = pick(PAGES);
    let exitPage = entryPage;

    for (let p = 0; p < pageViewCount; p++) {
      const path = p === 0 ? entryPage : pick(PAGES);
      exitPage = path;

      pageViewsToCreate.push({
        site: site._id,
        siteId: site.siteId,
        visitorId,
        sessionId,
        url: `https://${site.domain}${path}`,
        path,
        referrer: p === 0 ? referrer : '',
        device,
        browser,
        os,
        country,
        createdAt: new Date(startedAt.getTime() + p * 15000),
      });
    }

    sessionsToCreate.push({
      site: site._id,
      siteId: site.siteId,
      sessionId,
      visitorId,
      entryPage,
      exitPage,
      pageViewCount,
      isBounce,
      device,
      browser,
      os,
      country,
      referrer,
      startedAt,
      lastActivityAt: new Date(startedAt.getTime() + durationMs),
      durationMs,
      isActive: false,
    });

    if (Math.random() < 0.25) {
      eventsToCreate.push({
        site: site._id,
        siteId: site.siteId,
        visitorId,
        sessionId,
        eventName: pick(EVENT_NAMES),
        metadata: {},
        path: exitPage,
        createdAt: new Date(startedAt.getTime() + durationMs * 0.5),
      });
    }
  }

  await Session.insertMany(sessionsToCreate);
  await PageView.insertMany(pageViewsToCreate);
  await CustomEvent.insertMany(eventsToCreate);

  console.log(`Seeded ${sessionsToCreate.length} sessions, ${pageViewsToCreate.length} pageviews, ${eventsToCreate.length} events.`);
  console.log('');
  console.log('=== Demo credentials ===');
  console.log('Email:    demo@example.com');
  console.log('Password: demo1234');
  console.log('Site ID:  ', site.siteId);
  console.log('========================');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
