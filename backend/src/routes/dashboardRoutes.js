import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { verifySiteOwnership } from '../controllers/sitesController.js';
import {
  getDashboard,
  getOverview,
  getTimeSeries,
  getLiveVisitors,
} from '../controllers/dashboardController.js';

const router = express.Router();

router.use(requireAuth);

// All routes scoped to a specific site, e.g. /api/dashboard/site_abc123/overview
router.get('/:siteId/overview', verifySiteOwnership, getOverview);
router.get('/:siteId/timeseries', verifySiteOwnership, getTimeSeries);
router.get('/:siteId/live', verifySiteOwnership, getLiveVisitors);
router.get('/:siteId/full', verifySiteOwnership, getDashboard);

export default router;
