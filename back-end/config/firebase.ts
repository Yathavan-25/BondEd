import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !rawPrivateKey) {
  throw new Error("Missing Firebase credentials in the .env file.");
}

const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('Successfully connected to Firebase Admin SDK');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export const auth: Auth = getAuth();