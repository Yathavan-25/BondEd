import express from 'express';
import { 
    getSummaries, 
    getAnalytics 
} from '../controllers/summaryController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:studentId', protectRoute, getSummaries);
router.get('/analytics/:studentId', protectRoute, getAnalytics);

export default router;