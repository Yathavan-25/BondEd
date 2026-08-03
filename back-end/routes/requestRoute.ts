import express from 'express';
import {
  getSentRequests,
  getReceivedRequests,
  createStudyRequest,
  cancelStudyRequest,
  respondToRequest,
  getFriendsList
} from '../controllers/requestController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/sent/:userId', protectRoute, getSentRequests);
router.get('/received/:userId', protectRoute, getReceivedRequests);
router.post('/', protectRoute, createStudyRequest);                  
router.delete('/:requestId', protectRoute, cancelStudyRequest);      
router.patch('/:requestId/respond', protectRoute, respondToRequest); 
router.get('/friends/:userId', protectRoute, getFriendsList);

export default router;