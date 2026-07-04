import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listSites, createSite, deleteSite } from '../controllers/sitesController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', listSites);
router.post('/', createSite);
router.delete('/:siteId', deleteSite);

export default router;
