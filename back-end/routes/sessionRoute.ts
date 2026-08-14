import express from 'express';
import { 
    createSession, 
    getStudentSessions, 
    endVoiceSession,
    joinRoom,
    leaveCollabSession,
    endSession,
    getCollabRecording,
    saveSession,
    unsaveSession
} from '../controllers/sessionController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', protectRoute, createSession);
router.get('/student/:studentId', protectRoute, getStudentSessions);
router.post('/voice/end', protectRoute, endVoiceSession);
router.get('/:sessionId/recording', protectRoute, getCollabRecording);
router.post('/:sessionId/join', protectRoute, joinRoom);
router.post('/:sessionId/leave', protectRoute, leaveCollabSession);
router.post('/:sessionId/end', protectRoute, endSession);
router.post('/:sessionId/save', protectRoute, saveSession);
router.delete('/:sessionId/unsave', protectRoute, unsaveSession);

export default router;