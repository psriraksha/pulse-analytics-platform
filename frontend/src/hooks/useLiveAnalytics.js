import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api.js';

export function useLiveAnalytics(siteId) {
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [recentEvents, setRecentEvents] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!siteId) return;

    const socket = io(API_BASE_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('subscribe_site', siteId);
    });

    socket.on('visitor_count', ({ activeVisitors }) => {
      setActiveVisitors(activeVisitors);
    });

    socket.on('pageview', (payload) => {
      if (typeof payload.activeVisitors === 'number') {
        setActiveVisitors(payload.activeVisitors);
      }
      setRecentEvents((prev) => [{ type: 'pageview', ...payload }, ...prev].slice(0, 20));
    });

    socket.on('custom_event', (payload) => {
      setRecentEvents((prev) => [{ type: 'custom_event', ...payload }, ...prev].slice(0, 20));
    });

    return () => {
      socket.emit('unsubscribe_site', siteId);
      socket.disconnect();
    };
  }, [siteId]);

  return { activeVisitors, recentEvents };
}
