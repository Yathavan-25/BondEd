import express from 'express';
import { 
    getSummaries, 
    getAnalytics,
    getLastSummary
} from '../controllers/summaryController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/last/:studentId', protectRoute, getLastSummary);
router.get('/:studentId', protectRoute, getSummaries);
router.get('/analytics/:studentId', protectRoute, getAnalytics);

export default router;