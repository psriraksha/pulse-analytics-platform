# Pulse: SaaS Analytics Dashboard
 
A real-time website analytics platform for multiple companies, built with the MERN stack. A company signs up, adds a small tracking script to its website, and watches its traffic appear on a live dashboard.
 
![Dashboard](screenshots/dashboard.png)
 
## Features
 
- **Dashboard:** page views, unique visitors, bounce rate and average session time, with 7, 30 and 90 day views
- **Live view:** real-time visitor count and event feed using Socket.io
- **Breakdowns:** top pages, devices, browsers and referrers
- **Custom events:** track clicks and form submits with one line of code
- **Export:** download reports as PDF or CSV
- **Multi-tenant:** every company sees only its own sites and data
- **Secure login:** JWT authentication
- **Demo data:** a seed script creates a demo account with 30 days of sample traffic
## Tech Stack
 
| Area | Technology |
|---|---|
| Frontend | React (Vite), Axios, Socket.io client |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB (aggregation pipelines), Redis |
| Other | JWT, PDFKit, json2csv |
 
## More Screenshots
 
| Login | Top pages, devices, browsers and referrers |
|---|---|
| ![Login](screenshots/login.png) | ![Breakdown](screenshots/analytics-breakdown.png) |
 
## How It Works
 
1. A company signs up and gets a site with a public `siteId`.
2. The company adds the tracking script to its website: `<script src=".../tracker.js?siteId=XXX"></script>`
3. The script sends page views, a heartbeat every 20 seconds, and custom events to the API.
4. The API groups events into sessions, calculates bounce rate, and saves them to MongoDB.
5. Redis keeps track of who is online right now, and Socket.io pushes updates to the Live page.
6. The dashboard reads the data using MongoDB aggregation queries, and can export it as PDF or CSV.
## Project Structure
 
```
pulse/
├── backend/           Express API, Socket.io, MongoDB, Redis
│   ├── src/           models, routes, controllers, services, middleware
│   └── scripts/seed.js   demo account with 30 days of sample traffic
├── frontend/          React dashboard (Login, Dashboard, Live, Setup)
└── tracking-script/   the script added to customer websites
```
 
## Getting Started
 
**You need:** Node.js 18 or newer, MongoDB, and Redis (local or hosted).
 
**Backend**
```bash
cd backend
cp .env.example .env     # set JWT_SECRET, MONGO_URI, REDIS_URL
npm install
npm run seed             # optional: creates the demo account
npm run dev              # runs on http://localhost:5000
```
 
**Frontend**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # runs on http://localhost:3000
```
 
**Demo login (after running the seed):** `demo@example.com` / `demo1234`
 
Open the **Setup** page in the dashboard to get your tracking snippet. To test it, add the snippet to any HTML file, open it in a browser, and watch the **Live** page update.
 
## Design Decisions
 
- **Fast ingestion:** every event stores the public `siteId`, so writes never need a join, and site lookups are cached in Redis.
- **Live visitors with Redis:** a sorted set per site with a 60 second window gives the online count without heavy database reads.
- **Bounce rate** is updated as events arrive, so there is no batch recalculation.
- **Lightweight tracker:** no dependencies, and it uses `sendBeacon` so events still send when a visitor leaves the page.
- **Session cleanup:** a background job closes idle sessions every 5 minutes.
## Author
 
**P Sriraksha**
GitHub: [github.com/psriraksha](https://github.com/psriraksha)
LinkedIn: [linkedin.com/in/p-sriraksha-2a5758379](https://linkedin.com/in/p-sriraksha-2a5758379)
 
<img width="1857" height="705" alt="Screenshot 2026-11-17 170723" src="https://github.com/user-attachments/assets/6225ce2a-5971-416b-9a52-8bbf430ef73e" />
<img width="1883" height="811" alt="Screenshot 2026-11-17 170819" src="https://github.com/user-attachments/assets/5df274e3-0abe-409d-8d4e-9b39068c6011" />
<img width="1873" height="945" alt="Screenshot 2026-11-17 170805" src="https://github.com/user-attachments/assets/6c5a6ff7-3658-4498-86f0-b115c53f3c2e" />
<img width="1867" height="822" alt="Screenshot 2026-11-17 170749" src="https://github.com/user-attachments/assets/cf54553d-079d-4585-8e58-92550131b4b5" />

