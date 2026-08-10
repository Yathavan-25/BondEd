import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import * as userModel from '../models/userModel.js';

// Existing POST controller
export const submitQuestionnaire = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid } = req.user!;
    const { personality, learningStyle, knowledgeLevel, subjects, topics, availability, academicGoals, preferredVoice, avatarUrl, mfaEnabled } = req.body;

    const user = await userModel.getUserByFirebaseUid(uid);
    if (!user) {
      return res.status(404).json({ message: 'User must be synced before creating a profile.' });
    }

    const profile = await userModel.upsertUserProfile(user.id, {
      personality,
      learningStyle,
      knowledgeLevel,
      topics,
      subjects,
      availability,
      academicGoals,
      preferredVoice,
      avatarUrl,
      mfaEnabled
    });

    return res.status(200).json({ message: 'Profile completed successfully', profile });
  } catch (error) {
    console.error('Error saving profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// NEW: GET controller to fetch the profile data for the AI Assistant
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // The frontend passes the ID in the URL: /api/profile/cmrm7fqz...
    const { studentId } = req.params;

    if (!studentId) {
      res.status(400).json({ error: "Student ID is missing" });
      return;
    }

    const safeStudentId = Array.isArray(studentId) ? studentId[0] : studentId;

    // Now pass the safe string
    if (safeStudentId) {
      const profile = await userModel.getProfileByUserId(safeStudentId);

      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      // Return the profile nested in a 'profile' object so the frontend can read data.profile.topics
      res.status(200).json({ profile });
    }

  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};