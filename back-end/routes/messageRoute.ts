import express from 'express';
import { getMessages, getConversation, createChatMessage } from '../controllers/requestController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

// Order matters: conversation must come before /:userId
router.get('/conversation/:userId/:partnerId', protectRoute, getConversation);
router.get('/:userId', protectRoute, getMessages);
router.post('/', protectRoute, createChatMessage);

export default router;