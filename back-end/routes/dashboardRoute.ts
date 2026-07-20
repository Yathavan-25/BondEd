import express from 'express';
import { getDashboardData } from '../controllers/dashboardController.js';
import { protectRoute } from '../middleware/authMiddleware.js';
const router = express.Router();

// GET /api/dashboard/:userId
router.get('/:userId', protectRoute, getDashboardData);

export default router;