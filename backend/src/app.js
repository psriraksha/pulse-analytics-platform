import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import sitesRoutes from './routes/sitesRoutes.js';
import collectRoutes from './routes/collectRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import trackerRoutes from './routes/trackerRoutes.js';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false })); // allow tracker.js to be loaded cross-origin
  app.use(compression());
  app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));

  // Dashboard API CORS - locked to the configured frontend origin
  app.use(
    '/api/auth',
    cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true })
  );
  app.use(
    '/api/sites',
    cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true })
  );
  app.use(
    '/api/dashboard',
    cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true })
  );
  app.use(
    '/api/export',
    cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true })
  );

  // Rate limiting on the public ingestion endpoint to prevent abuse/runaway costs
  const collectLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: Number(process.env.RATE_LIMIT_MAX) || 120,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  app.use('/tracker.js', trackerRoutes);
  app.use('/api/collect', collectLimiter, collectRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/sites', sitesRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/export', exportRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Centralized error handler
  app.use((err, req, res, next) => {
    console.error('[unhandled error]', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
