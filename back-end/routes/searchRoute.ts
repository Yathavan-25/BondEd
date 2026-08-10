import express from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:userId', protectRoute, globalSearch);

export default router;
