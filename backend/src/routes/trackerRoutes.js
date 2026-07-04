import express from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Cache the template in memory; it's a static file on disk
const scriptTemplate = readFileSync(
  join(__dirname, '../../../tracking-script/collect.js'),
  'utf-8'
);

// GET /tracker.js?siteId=site_abc123
// Returns the tracking script with the siteId and API URL baked in,
// so the customer just embeds: <script src="https://yourapp.com/tracker.js?siteId=XXX"></script>
router.get('/', (req, res) => {
  const { siteId } = req.query;

  if (!siteId) {
    return res.status(400).send('// Error: siteId query parameter is required');
  }

  const apiBase = process.env.TRACKING_SCRIPT_BASE_URL || `${req.protocol}://${req.get('host')}`;

  const script = scriptTemplate
    .replace('__SITE_ID__', siteId)
    .replace('__API_BASE__', apiBase);

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(script);
});

export default router;
