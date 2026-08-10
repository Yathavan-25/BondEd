import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import * as userModel from '../models/userModel.js';

import nodemailer from 'nodemailer';

// In-memory OTP store for MFA codes: email -> { code, expiresAt }
const mfaStore = new Map<string, { code: string; expiresAt: number }>();

// =========================================================================
// 🚨 MFA CONFIGURATION TOGGLE FOR TESTING VS PRODUCTION
// Set TEST_MFA_BYPASS = true for LOCAL TESTING (allows code "123456" or console OTP).
// Set TEST_MFA_BYPASS = false for PRODUCTION deployment (strictly enforces real OTP matching).
// =========================================================================
export const TEST_MFA_BYPASS = false; 

export const sendMfaCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'Email is required to send MFA code.' });
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    mfaStore.set(email.toLowerCase(), { code, expiresAt });

    // Dispatch 6-digit code via email using Nodemailer
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpUser = process.env.SMTP_USER?.trim();
    const rawPass = process.env.SMTP_PASS?.trim() || '';
    const smtpPass = rawPass.replace(/["'\s]/g, '');

    if (smtpUser && smtpPass) {
      try {
        const isGmail = smtpHost.includes('gmail') || smtpUser.endsWith('@gmail.com');
        const transporter = nodemailer.createTransport(
          isGmail
            ? {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: { user: smtpUser, pass: smtpPass }
              }
            : {
                host: smtpHost,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: { user: smtpUser, pass: smtpPass }
              }
        );

        await transporter.sendMail({
          from: `"BondEd Security" <${smtpUser}>`,
          to: email,
          subject: `🔒 Your BondEd 2FA Security Code: ${code}`,
          text: `
===============================================
BondEd 2FA Security Verification
===============================================
Your 6-digit authentication code is:

👉  ${code}  👈

This code will expire in 10 minutes.
If you did not request this code, please secure your account immediately.
===============================================
          `,
          headers: {
            'X-Priority': '1 (Highest)',
            'X-MSMail-Priority': 'High',
            'Importance': 'High'
          }
        });
        console.log(`✅ [MFA EMAIL] Verification code sent to ${email}`);
      } catch (mailErr) {
        console.error('❌ [MFA EMAIL ERROR] Failed to send MFA email via SMTP:', mailErr);
      }
    } else {
      console.log(`⚠️ [MFA NOTICE] SMTP_USER / SMTP_PASS not set in back-end/.env.`);
    }

    return res.status(200).json({
      message: 'MFA security code sent to your email.',
      email
    });
  } catch (error) {
    console.error('Error sending MFA code:', error);
    return res.status(500).json({ message: 'Failed to send MFA code' });
  }
};

export const verifyMfaCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body || {};

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required.' });
    }

    // Easy bypass for testing mode
    if (TEST_MFA_BYPASS && (code === '123456' || code === '000000')) {
      return res.status(200).json({ message: 'MFA verified via testing bypass' });
    }

    const storedData = mfaStore.get(email.toLowerCase());

    if (!storedData) {
      return res.status(400).json({ message: 'No MFA code found for this email. Please click resend.' });
    }

    if (Date.now() > storedData.expiresAt) {
      mfaStore.delete(email.toLowerCase());
      return res.status(400).json({ message: 'MFA code has expired. Please request a new code.' });
    }

    if (storedData.code !== code.trim()) {
      return res.status(400).json({ message: 'Invalid 6-digit security code. Please check and try again.' });
    }

    // Code matches! Clear from store
    mfaStore.delete(email.toLowerCase());
    return res.status(200).json({ message: 'MFA verification successful' });
  } catch (error) {
    console.error('Error verifying MFA code:', error);
    return res.status(500).json({ message: 'Internal server error during MFA verification' });
  }
};

export const syncUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { uid, email } = req.user!;
    const { firstName, lastName } = req.body || {};
    
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

export const getUserCount = async (_req: Request, res: Response) => {
  try {
    const count = await userModel.getTotalUserCount();
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching user count:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

