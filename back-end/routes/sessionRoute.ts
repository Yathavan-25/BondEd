import express from 'express';
import { 
    createSession, 
    getStudentSessions, 
    endVoiceSession,
    joinRoom,
} from '../controllers/sessionController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', protectRoute, createSession);
router.get('/student/:studentId', protectRoute, getStudentSessions);
router.post('/voice/end', protectRoute, endVoiceSession);

// <-- 2. ADD THIS MISSING ROUTE
router.post('/:sessionId/join', protectRoute, joinRoom);

export default router;