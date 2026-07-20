import { Router } from 'express';
import { syncUser } from '../controllers/authController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = Router();

// Endpoint to sync or register a verified user
router.post('/sync', protectRoute, syncUser);

export default router;