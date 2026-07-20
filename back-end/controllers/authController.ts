import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import * as userModel from '../models/userModel.js';

export const syncUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid, email } = req.user!;
    const { firstName, lastName } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required from Firebase token.' });
    }

    // Pass the Firebase UID and email to the model to sync with PostgreSQL
    const user = await userModel.syncUserWithFirebase(uid, email, firstName, lastName );
    
    return res.status(200).json({ message: 'User synced successfully', user });
  } catch (error) {
    console.error('Error syncing user:', error);
    return res.status(500).json({ message: 'Internal server error during sync' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.user!;
    const user = await userModel.getUserByFirebaseUid(uid);

    if (!user) {
      return res.status(404).json({ message: 'User not found in database.' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

