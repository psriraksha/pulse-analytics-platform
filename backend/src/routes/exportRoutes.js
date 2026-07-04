import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { verifySiteOwnership } from '../controllers/sitesController.js';
import { exportPdf, exportCsv } from '../controllers/exportController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/:siteId/pdf', verifySiteOwnership, exportPdf);
router.get('/:siteId/csv', verifySiteOwnership, exportCsv);

export default router;
