import { Router } from 'express';
import { syncUser, getUserCount, sendMfaCode, verifyMfaCode } from '../controllers/authController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = Router();

// Public endpoint to get total registered user count
router.get('/count', getUserCount);

// MFA Endpoints
router.post('/send-mfa-code', sendMfaCode);
router.post('/verify-mfa-code', verifyMfaCode);

// Endpoint to sync or register a verified user
router.post('/sync', protectRoute, syncUser);

export default router;