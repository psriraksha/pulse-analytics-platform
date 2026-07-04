import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { connectMongo } from './config/db.js';
import { getRedisClient } from './config/redis.js';
import { setupSocketHandlers } from './services/socketService.js';
import { startSessionSweeper } from './services/sessionSweeper.js';

async function main() {
  await connectMongo();
  getRedisClient(); // initializes the connection eagerly so failures surface at boot

  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  setupSocketHandlers(io);
  startSessionSweeper();

  // Make io accessible to controllers via req.app.get('io')
  app.set('io', io);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`[server] listening on port ${PORT}`);
    console.log(`[server] tracking script available at /tracker.js?siteId=YOUR_SITE_ID`);
  });
}

main().catch((err) => {
  console.error('[server] fatal startup error:', err);
  process.exit(1);
});
