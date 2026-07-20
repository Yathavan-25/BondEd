import type { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase.js'; // Adjust path to your firebase admin init

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const protectRoute = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
        return res.status(401).json({ message: 'Unauthorized: Header missing or invalid' });
    }

    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : authHeader;

    // 2. Extra safety: ensure it's actually a string before Firebase touches it
    if (typeof token !== 'string') {
        return res.status(401).json({ message: 'Unauthorized: Token is not a string' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    return next();

  } catch (error) {
    console.error(' Firebase Verification Error:', error);
    return res.status(403).json({ message: 'Forbidden' });
  }
};