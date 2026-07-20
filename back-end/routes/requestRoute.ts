import express from 'express';
import {
  getSentRequests,
  getReceivedRequests,
  createStudyRequest,
  cancelStudyRequest,
  respondToRequest
} from '../controllers/requestController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/sent/:userId', protectRoute, getSentRequests);
router.get('/received/:userId', protectRoute, getReceivedRequests);
router.post('/', protectRoute, createStudyRequest);                  // POST /api/requests
router.delete('/:requestId', protectRoute, cancelStudyRequest);      // DELETE /api/requests/:requestId
router.patch('/:requestId/respond', protectRoute, respondToRequest); // PATCH /api/requests/:requestId/respond

export default router;