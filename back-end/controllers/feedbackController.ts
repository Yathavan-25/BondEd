import type { Request, Response } from 'express';
import nodemailer from 'nodemailer';

export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rating, easeOfUse, platformQuality, wouldRecommend, opinion, userEmail, userName } = req.body;

    if (!opinion && !rating) {
      res.status(400).json({ error: 'Please provide rating or feedback comments.' });
      return;
    }

    const recipientEmail = process.env.FEEDBACK_RECIPIENT_EMAIL || 'dev.bonded@gmail.com';
    const sender = userName || (userEmail ? userEmail.split('@')[0] : 'Anonymous Student');
    const senderEmailStr = userEmail ? ` (${userEmail})` : '';

    const emailSubject = `[BondEd Platform Feedback] ${rating ? `${rating}/5★` : 'Feedback'} from ${sender}${senderEmailStr}`;

    const formattedBody = `
===============================================
BondEd Student Platform Feedback
===============================================
Date: ${new Date().toLocaleString()}
User Name: ${userName || 'Not provided'}
User Email: ${userEmail || 'Not provided'}

--- QUESTIONNAIRE RESPONSES ---
⭐ Overall Rating: ${rating ? `${rating} / 5 Stars` : 'N/A'}
⚡ Ease of Use: ${easeOfUse || 'N/A'}
🎓 Platform Quality: ${platformQuality || 'N/A'}
👍 Would Recommend: ${wouldRecommend ? 'Yes' : 'No'}

--- USER OPINION & SUGGESTIONS ---
${opinion || 'No additional comments provided.'}

===============================================
    `;

    console.log(`\n======================================================`);
    console.log(`📩 NEW FEEDBACK RECEIVED FOR dev.boned@gmail.com:`);
    console.log(formattedBody);
    console.log(`======================================================\n`);

    // If SMTP environment variables exist, send via nodemailer
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpUser = process.env.SMTP_USER?.trim();
    const rawPass = process.env.SMTP_PASS?.trim() || '';
    const smtpPass = rawPass.replace(/\s+/g, ''); // Strip spaces from App Password (Google gives 16 chars like "abcd efgh ijkl mnop")

    let emailSent = false;

    if (smtpUser && smtpPass) {
      try {
        const isGmail = smtpHost.includes('gmail') || smtpUser.endsWith('@gmail.com');

        const transporter = nodemailer.createTransport(
          isGmail
            ? {
              service: 'gmail',
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
          from: `"BondEd Student Feedback" <${smtpUser}>`,
          to: recipientEmail,
          replyTo: userEmail ? `"${sender}" <${userEmail}>` : smtpUser,
          subject: emailSubject,
          text: formattedBody,
          headers: {
            'X-Priority': '1 (Highest)',
            'X-MSMail-Priority': 'High',
            'Importance': 'High'
          }
        });

        emailSent = true;
        console.log(`✅ [FEEDBACK EMAIL] Successfully dispatched email to ${recipientEmail}`);
      } catch (mailErr: any) {
        console.error(`❌ [FEEDBACK EMAIL ERROR] Failed to send email via SMTP:`, mailErr?.message || mailErr);
      }
    } else {
      console.log(`⚠️ [FEEDBACK NOTICE] SMTP_USER/SMTP_PASS not set in back-end/.env. Feedback was logged to console.`);
    }

    res.status(200).json({
      success: true,
      emailSent,
      recipient: recipientEmail,
      message: 'Thank you for your valuable feedback! Your thoughts directly help us improve BondEd.'
    });
  } catch (error) {
    console.error('Error handling feedback submission:', error);
    res.status(500).json({ error: 'Failed to process feedback submission' });
  }
};
