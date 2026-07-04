# Pulse — SaaS Analytics Dashboard Platform

A multi-tenant, real-time website analytics platform built on the MERN stack.
Companies sign up, get a tracking snippet, embed it on their site, and watch
traffic roll into a live dashboard — page views, sessions, bounce rate, device
breakdown, live visitor count, custom events, and PDF/CSV exports.

## Architecture

```
saas-analytics/
├── backend/              Express API + Socket.io + MongoDB + Redis
│   ├── src/
│   │   ├── models/       Company, Site, PageView, Session, CustomEvent
│   │   ├── routes/       auth, sites, collect (public), dashboard, export, tracker
│   │   ├── controllers/  request handlers
│   │   ├── services/     ingestion pipeline, aggregation queries, PDF/CSV export, sockets
│   │   ├── middleware/   JWT auth, site resolution + caching, public CORS
│   │   └── config/       MongoDB + Redis connections
│   └── scripts/seed.js   generates a demo account with 30 days of synthetic traffic
├── frontend/             React (Vite) dashboard
│   └── src/
│       ├── pages/        Login, Signup, Dashboard, Live, Setup
│       ├── components/   Sidebar, MetricCard, SiteSelector, ProtectedRoute
│       ├── hooks/        useSites, useLiveAnalytics (Socket.io)
│       ├── context/      AuthContext
│       └── services/     axios API client
└── tracking-script/
    └── collect.js        the snippet embedded on customer websites
```

## How the pipeline works

1. **Sign up** → a `Company` is created and a `Site` is auto-provisioned with a
   public `siteId`.
2. **Embed the snippet** → `<script src=".../tracker.js?siteId=XXX">` is added
   to the customer's site. The script:
   - generates a persistent `visitorId` (localStorage) and a rolling `sessionId`
     (sessionStorage, 30 min idle timeout)
   - fires a pageview beacon on load and on every SPA route change (patches
     `pushState`/`replaceState`)
   - sends a heartbeat every 20s while the tab is visible (powers the live
     visitor count)
   - exposes `window.Analytics.track(name, metadata)` and a
     `data-analytics-event` attribute for custom events (clicks, form submits)
3. **Ingestion** (`/api/collect/*`) → `resolveSite` middleware validates the
   `siteId` (cached in Redis to avoid a DB hit per event), then
   `ingestionService` stitches the event into a `Session` (new vs continuing,
   bounce calculation), writes the `PageView`/`CustomEvent`, marks the visitor
   active in a Redis sorted set, and emits a Socket.io event to any dashboard
   subscribed to that site's room.
4. **Dashboard** (`/api/dashboard/*`) → JWT-protected, scoped to the requesting
   company's own sites. `analyticsService` runs MongoDB aggregation pipelines
   for time series, device/browser breakdown, top pages, referrers, and custom
   events.
5. **Live page** → connects over Socket.io, joins `site:{siteId}`, and reflects
   real-time pageviews/events plus an active-visitor count backed by a Redis
   sorted set with a 60s freshness window.
6. **Exports** → `exportService` streams a PDF report directly to the response
   with PDFKit, or returns a CSV via `json2csv` for whichever slice
   (pages/devices/referrers/events/timeseries) is requested.

A background **session sweeper** runs every 5 minutes to close out sessions
that have gone idle for 30+ minutes, keeping "active session" data honest.

## Local setup

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a connection string)
- Redis running locally (or a connection string)

### Backend
```bash
cd backend
cp .env.example .env       # edit JWT_SECRET, MONGO_URI, REDIS_URL as needed
npm install
npm run seed                # optional: creates demo@example.com / demo1234 with 30 days of fake traffic
npm run dev                  # starts on :5000
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev                  # starts on :3000
```

Visit `http://localhost:3000`, log in with the seeded demo account (or sign
up), then check the **Setup** page for your tracking snippet.

### Trying the tracking script locally
Drop this into any local HTML file and open it in a browser — it will report
into your seeded demo site (use that site's actual `siteId` from the Setup page):

```html
<script src="http://localhost:5000/tracker.js?siteId=YOUR_SITE_ID"></script>
```

Open the **Live** page in the dashboard in another tab and refresh the test
page a few times — you'll see the active visitor count and event feed update
in real time.

## Notable design decisions

- **Multi-tenancy**: every analytics document carries both the Mongo
  `ObjectId` reference and a denormalized `siteId` string (the public tracking
  ID), so the high-volume ingestion path never needs a join to write data, and
  all dashboard queries are scoped by a single indexed field.
- **Redis is used in two ways**: (1) a short-TTL cache for site lookups on the
  hot ingestion path, and (2) a sorted set per site for "who's online right
  now," which avoids hammering MongoDB with read traffic from a feature that's
  inherently about high-frequency reads.
- **Bounce rate** is computed from `Session.pageViewCount` and updated
  incrementally as new pageviews/events arrive — no batch recomputation needed.
- **The tracking script has no dependencies and uses `sendBeacon`** with a
  `fetch + keepalive` fallback, so analytics events reliably fire even as the
  user navigates away.
