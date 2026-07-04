import express from 'express';
import { publicCors } from '../middleware/publicCors.js';
import { resolveSite } from '../middleware/resolveSite.js';
import {
  collectPageView,
  collectCustomEvent,
  collectHeartbeat,
} from '../controllers/collectController.js';

const router = express.Router();

router.use(publicCors);

router.post('/pageview', resolveSite, collectPageView);
router.post('/event', resolveSite, collectCustomEvent);
router.post('/heartbeat', resolveSite, collectHeartbeat);

export default router;
