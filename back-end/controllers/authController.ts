import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import * as userModel from '../models/userModel.js';

import { BrevoClient } from '@getbrevo/brevo';
import { auth as firebaseAdminAuth } from '../config/firebase.js';

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

    // Dispatch 6-digit code via email using Brevo (HTTP API — no SMTP ports, no recipient restrictions)
    const brevoApiKey = process.env.BREVO_API_KEY?.trim();

    if (brevoApiKey) {
      try {
        const brevo = new BrevoClient({ apiKey: brevoApiKey });
        const fromEmail = process.env.BREVO_FROM_EMAIL || 'dev.bonded@gmail.com';
        const fromName = 'BondEd Security';

        const html = `<!DOCTYPE html>
                      <html lang="en">
                      <head>
                        <meta charset="UTF-8" />
                        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                        <meta name="color-scheme" content="light" />
                        <meta name="supported-color-schemes" content="light" />
                        <title>BondEd 2FA Verification</title>
                        <style>
                          :root { color-scheme: light; }
                        </style>
                      </head>
                      <body style="margin:0;padding:0;background-color:#f0f0f8;font-family:'Segoe UI',Arial,sans-serif;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f8;padding:40px 20px;">
                          <tr>
                            <td align="center">
                              <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(109,40,217,0.15);">

                                <!-- Header: purple gradient — immune to dark mode inversion -->
                                <tr>
                                  <td style="background:linear-gradient(135deg,#6d28d9 0%,#7c3aed 50%,#4f46e5 100%);padding:36px 40px 28px;text-align:center;">
                                    <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:12px;padding:10px 22px;margin-bottom:16px;">
                                      <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;">Bond<span style="color:#ddd6fe;">Ed</span></span>
                                    </div>
                                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">Two-Factor Authentication</h1>
                                    <p style="margin:8px 0 0;color:#ddd6fe;font-size:14px;">Security Verification Code</p>
                                  </td>
                                </tr>

                                <!-- Body: white background — safe in all email clients & dark modes -->
                                <tr>
                                  <td style="background:#ffffff;padding:36px 40px;">

                                    <p style="margin:0 0 6px;color:#6d28d9;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Your verification code</p>
                                    <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.6;">
                                      Use the code below to complete your sign-in to BondEd. This code is valid for <strong style="color:#6d28d9;">10 minutes</strong>.
                                    </p>

                                    <!-- OTP Box: white bg, dark code — always readable -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                                      <tr>
                                        <td style="background:#f5f3ff;border:2px solid #7c3aed;border-radius:14px;padding:28px 20px;text-align:center;">
                                          <p style="margin:0 0 12px;color:#6d28d9;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;">One-Time Passcode</p>
                                          <p style="margin:0;letter-spacing:14px;font-size:46px;font-weight:800;color:#3b0764;font-family:'Courier New',Courier,monospace;text-indent:14px;">${code}</p>
                                          <p style="margin:12px 0 0;color:#7c3aed;font-size:11px;font-weight:600;">Expires in 10 minutes</p>
                                        </td>
                                      </tr>
                                    </table>

                                    <!-- Warning -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                                      <tr>
                                        <td style="background:#fff5f5;border-left:4px solid #ef4444;border-radius:8px;padding:16px 18px;">
                                          <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;">
                                            ⚠️ <strong>Did not request this?</strong><br/>
                                            If you didn't try to sign in, your account may be at risk. Please change your password immediately and contact support.
                                          </p>
                                        </td>
                                      </tr>
                                    </table>

                                    <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;text-align:center;">
                                      Do not share this code with anyone.<br/>BondEd will never ask for your code via phone or email.
                                    </p>
                                  </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                  <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                                    <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">This is an automated message from BondEd Security.</p>
                                    <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} BondEd Collaborative Learning Platform. All rights reserved.</p>
                                  </td>
                                </tr>

                              </table>
                            </td>
                          </tr>
                        </table>
                      </body>
                      </html>`;

        await brevo.transactionalEmails.sendTransacEmail({
          sender: { email: fromEmail, name: fromName },
          to: [{ email }],
          subject: '🔒 Your BondEd 2FA Security Code',
          textContent: `BondEd Two-Factor Authentication\n\nYour 6-digit verification code is: ${code}\n\nThis code expires in 10 minutes.\nIf you did not request this, please secure your account immediately.`,
          htmlContent: html,
        });
        console.log(`✅ [MFA EMAIL] Verification code sent to ${email} via Brevo`);
      } catch (mailErr: any) {
        const errMsg = mailErr?.message || String(mailErr);
        console.error('❌ [MFA EMAIL ERROR] Brevo exception:', errMsg);
        return res.status(500).json({
          message: 'Failed to send MFA email. Check BREVO_API_KEY in Railway environment variables.',
          detail: errMsg
        });
      }
    } else {
      console.log(`⚠️ [MFA NOTICE] BREVO_API_KEY not set in Railway environment variables.`);
      return res.status(500).json({ message: 'Email service not configured. Add BREVO_API_KEY to Railway environment variables.' });
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
    const user = await userModel.syncUserWithFirebase(uid, email, firstName, lastName);

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

export const sendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'Email is required to send verification link.' });
    }

    const clientUrl = process.env.CLIENT_URL || process.env.NEXT_PUBLIC_URL || 'https://bond-ed.vercel.app';
    // Redirect the Firebase verification link to a simple confirmation page, NOT OnBoardingFlow.
    // This ensures that clicking the link on a phone only shows a confirmation message,
    // while the original register tab (where polling runs) handles the actual onboarding redirect.
    const redirectUrl = `${clientUrl.replace(/\/$/, '')}/VerifyEmail`;

    const actionCodeSettings = {
      url: redirectUrl
    };

    let link = redirectUrl;
    try {
      link = await firebaseAdminAuth.generateEmailVerificationLink(email, actionCodeSettings);
    } catch (linkErr) {
      console.warn('Could not generate Firebase verification link, falling back to direct target URL:', linkErr);
    }

    const brevoApiKey = process.env.BREVO_API_KEY?.trim();
    if (brevoApiKey) {
      const brevo = new BrevoClient({ apiKey: brevoApiKey });
      const fromEmail = process.env.BREVO_FROM_EMAIL || 'dev.bonded@gmail.com';
      const fromName = 'BondEd Security';

      const html = `<!DOCTYPE html>
                  <html lang="en">
                  <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                    <meta name="color-scheme" content="light" />
                    <meta name="supported-color-schemes" content="light" />
                    <title>Verify Your BondEd Account</title>
                    <style>:root { color-scheme: light; }</style>
                  </head>
                  <body style="margin:0;padding:0;background-color:#f0f0f8;font-family:'Segoe UI',Arial,sans-serif;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f8;padding:40px 20px;">
                      <tr>
                        <td align="center">
                          <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(109,40,217,0.15);">
                            <tr>
                              <td style="background:linear-gradient(135deg,#6d28d9 0%,#7c3aed 50%,#4f46e5 100%);padding:36px 40px 28px;text-align:center;">
                                <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:12px;padding:10px 22px;margin-bottom:16px;">
                                  <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;">Bond<span style="color:#ddd6fe;">Ed</span></span>
                                </div>
                                <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">Verify Your Email Address</h1>
                                <p style="margin:8px 0 0;color:#ddd6fe;font-size:14px;">Welcome to BondEd</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="background:#ffffff;padding:36px 40px;text-align:center;">
                                <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                                  Welcome to <strong>BondEd</strong>! Please click the button below to verify your email address and activate your account.
                                </p>
                                <div style="margin:28px 0;">
                                  <a href="${link}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#4f46e5);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;box-shadow:0 4px 14px rgba(109,40,217,0.4);">
                                    Verify Email Address
                                  </a>
                                </div>
                                <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                                  If the button doesn't work, copy and paste this link into your browser:<br/>
                                  <a href="${link}" style="color:#6d28d9;word-break:break-all;">${link}</a>
                                </p>
                              </td>
                            </tr>
                            <tr>
                              <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                                <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} BondEd Collaborative Learning Platform. All rights reserved.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                  </html>`;

      await brevo.transactionalEmails.sendTransacEmail({
        sender: { email: fromEmail, name: fromName },
        to: [{ email }],
        subject: '✉️ Verify your email address for BondEd',
        textContent: `Welcome to BondEd! Verify your email using this link: ${link}`,
        htmlContent: html,
      });
      console.log(`✅ [VERIFY EMAIL] Verification email sent to ${email} via Brevo`);
    } else {
      console.log(`⚠️ [VERIFY NOTICE] BREVO_API_KEY not set. Cannot send verification email.`);
    }

    return res.status(200).json({ message: 'Verification email sent successfully.' });
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    return res.status(500).json({ message: 'Failed to send verification email', detail: error?.message });
  }
};

