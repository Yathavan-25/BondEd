import type { Request, Response } from 'express';
import nodemailer from 'nodemailer';

export const submitContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({ error: 'Please provide name, email, and message.' });
      return;
    }

    const recipientEmail = process.env.CONTACT_RECIPIENT_EMAIL || 'dev.bonded@gmail.com';

    const emailSubject = `[BondEd Contact Form] ${subject || 'New Inquiry'} from ${name}`;

    const formattedBody = `
===============================================
BondEd Contact Form Submission
===============================================
Date: ${new Date().toLocaleString()}
Name: ${name}
Email: ${email}
Subject: ${subject || 'Not provided'}

--- MESSAGE ---
${message}
===============================================
    `;

    console.log(`\n======================================================`);
    console.log(`📩 NEW CONTACT MESSAGE RECEIVED FOR dev.bonded@gmail.com:`);
    console.log(formattedBody);
    console.log(`======================================================\n`);

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpUser = process.env.SMTP_USER?.trim();
    const rawPass = process.env.SMTP_PASS?.trim() || '';
    const smtpPass = rawPass.replace(/\s+/g, '');

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
          from: `"BondEd Contact Form" <${smtpUser}>`,
          to: recipientEmail,
          replyTo: `"${name}" <${email}>`,
          subject: emailSubject,
          text: formattedBody,
          headers: {
            'X-Priority': '1 (Highest)',
            'X-MSMail-Priority': 'High',
            'Importance': 'High'
          }
        });

        emailSent = true;
        console.log(`✅ [CONTACT EMAIL] Successfully dispatched email to ${recipientEmail}`);
      } catch (mailErr: any) {
        console.error(`❌ [CONTACT EMAIL ERROR] Failed to send email via SMTP:`, mailErr?.message || mailErr);
      }
    } else {
      console.log(`⚠️ [CONTACT NOTICE] SMTP_USER/SMTP_PASS not set in back-end/.env. Message was logged to console.`);
    }

    res.status(200).json({
      success: true,
      emailSent,
      message: 'Your message has been sent successfully!'
    });
  } catch (error) {
    console.error('Error handling contact submission:', error);
    res.status(500).json({ error: 'Failed to process contact submission' });
  }
};
