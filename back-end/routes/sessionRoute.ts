import express from 'express';
import { 
    createSession, 
    getStudentSessions, 
    endVoiceSession,
    joinRoom,
    getCollabRecording
} from '../controllers/sessionController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', protectRoute, createSession);
router.get('/student/:studentId', protectRoute, getStudentSessions);
router.post('/voice/end', protectRoute, endVoiceSession);
router.get('/:sessionId/recording', protectRoute, getCollabRecording);
router.post('/:sessionId/join', protectRoute, joinRoom);

export default router;