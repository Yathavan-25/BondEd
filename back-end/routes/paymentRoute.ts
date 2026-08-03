import { Router } from 'express';
import { protectRoute } from '../middleware/authMiddleware.js';
import { createCheckoutSession, getUserCredits } from '../controllers/paymentController.js';

const router = Router();

// Standard API routes (JSON body)
router.get('/credits/:studentId', protectRoute, getUserCredits);
router.post('/create-checkout', protectRoute, createCheckoutSession);

export default router;