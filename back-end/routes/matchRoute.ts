import express from 'express';
import { getMatches } from '../controllers/matchController.js';
import { protectRoute } from '../middleware/authMiddleware.js';
const router = express.Router();

router.get("/:userId", protectRoute, getMatches);

export default router;