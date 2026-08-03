import type { Request, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../config/prisma.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any,
});

// Helper: Ensure safe string extraction
const getStringParam = (param: string | string[] | undefined): string | null => {
    if (Array.isArray(param)) return param[0] || null;
    return (param !== undefined && param !== "") ? param : null;
};

// 1. Fetch Current Credits
export const getUserCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = getStringParam(req.params.studentId);
    if (!studentId) {
        res.status(400).json({ error: "Missing student ID" });
        return;
    }

    const credits = await prisma.userCredits.findUnique({
      where: { userId: studentId }
    });
    
    if (!credits) {
       res.status(200).json({ vapiMinutesRemaining: 0, dailyMinutesRemaining: 0 });
       return;
    }
    res.status(200).json(credits);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch credits" });
  }
};

// 2. Create Stripe Checkout Session (SECURED WITH FIREBASE AUTH)
export const createCheckoutSession = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { planName } = req.body;
    const { uid } = req.user!; // Secured from authMiddleware!

    // Fetch the internal Postgres User ID using the Firebase UID
    const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
    if (!user) {
        res.status(404).json({ error: "User not found in database." });
        return;
    }

    let price = 0; let vapi = 0; let daily = 0;
    if (planName === "Starter") { price = 1000; vapi = 200; daily = 500; } 
    else if (planName === "Student") { price = 2500; vapi = 500; daily = 1000; } 
    else if (planName === "Premium") { price = 4500; vapi = 1000; daily = 2000; } 
    else { res.status(400).json({ error: "Invalid plan" }); return; }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `BondEd ${planName} Plan` },
          unit_amount: price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/Student/${user.id}/Dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/Student/${user.id}/Pricing?payment=cancelled`,
      metadata: {
        userId: user.id, // Guarantee this is a string
        planName: String(planName),
        vapiMinutes: String(vapi),
        dailyMinutes: String(daily)
      }
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};

// 3. Secure Webhook
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Strictly parse metadata to satisfy TypeScript exactOptionalPropertyTypes
    const userId = String(session.metadata?.userId || "");
    const vapiMinutes = Number(session.metadata?.vapiMinutes || 0);
    const dailyMinutes = Number(session.metadata?.dailyMinutes || 0);
    const paymentIntentId = String(session.payment_intent || "");

    if (userId) {
        await prisma.$transaction([
          prisma.userCredits.upsert({
            where: { userId: userId },
            update: {
              vapiMinutesRemaining: { increment: vapiMinutes },
              dailyMinutesRemaining: { increment: dailyMinutes }
            },
            create: {
              userId: userId,
              vapiMinutesRemaining: vapiMinutes,
              dailyMinutesRemaining: dailyMinutes
            }
          }),
          prisma.creditTransaction.create({
            data: {
              userId: userId,
              amount: (session.amount_total || 0) / 100,
              stripePaymentId: paymentIntentId,
              vapiMinutes: vapiMinutes,
              dailyMinutes: dailyMinutes,
              status: 'completed'
            }
          })
        ]);
    }
  }

  res.status(200).json({ received: true });
};