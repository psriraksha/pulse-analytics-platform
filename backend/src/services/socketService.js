import { getActiveVisitorCount } from '../config/redis.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('[socket] client connected:', socket.id);

    // Dashboard client subscribes to a specific site's live room after auth
    // on the frontend confirms it owns that site.
    socket.on('subscribe_site', async (siteId) => {
      if (!siteId) return;
      socket.join(`site:${siteId}`);

      const count = await getActiveVisitorCount(siteId);
      socket.emit('visitor_count', { activeVisitors: count });
    });

    socket.on('unsubscribe_site', (siteId) => {
      if (!siteId) return;
      socket.leave(`site:${siteId}`);
    });

    socket.on('disconnect', () => {
      console.log('[socket] client disconnected:', socket.id);
    });
  });
}
