import prisma from '../config/prisma.js';

export const syncUserWithFirebase = async (firebaseUid: string, email: string, firstName?: string, lastName?: string) => {
  return await prisma.user.upsert({
    where: { firebaseUid },
    update: {},
    create: {
      firebaseUid,
      email,
      firstName : firstName ?? null,
      lastName : lastName ?? null,
      credits: {
        create: {
          vapiMinutesRemaining: 5,
          dailyMinutesRemaining: 30
        }
      }
    },
    include: {
      profile: true,
      credits: true
    }
  });
};

export const getUserByFirebaseUid = async (firebaseUid: string) => {
  return await prisma.user.findUnique({
    where: { firebaseUid },
    include: {
      profile: true,
      credits: true
    }
  });
};

export const upsertUserProfile = async (
  userId: string, 
  profileData: {
    personality: any;
    learningStyle: string[];
    knowledgeLevel: any;
    topics : string[];
    subjects: string[];
    availability: any;
    academicGoals: string;
  }
) => {
  return await prisma.profile.upsert({
    where: { userId },
    update: profileData,
    create: {
      userId,
      ...profileData
    }
  });
};

export const getProfileByUserId = async (userId: string) => {
  return await prisma.profile.findUnique({
    where: { userId }
  });
};