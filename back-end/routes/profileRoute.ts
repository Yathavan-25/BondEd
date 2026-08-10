import { Router } from 'express';
import { protectRoute } from '../middleware/authMiddleware.js';
import { submitQuestionnaire, getProfile } from '../controllers/profileController.js'; // <-- import getProfile

const router = Router();

// POST routes (support both / and /questionnaire)
router.post('/', protectRoute, submitQuestionnaire);
router.post('/questionnaire', protectRoute, submitQuestionnaire);

// NEW: GET route
router.get('/:studentId', protectRoute, getProfile);

export default router;