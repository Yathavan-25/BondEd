import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Import Routes
import authRoutes from './routes/authRoute.js';
import profileRoutes from './routes/profileRoute.js';
import dashboardRoute from './routes/dashboardRoute.js';
import sessionRoute from './routes/sessionRoute.js';
import matchRouter from './routes/matchRoute.js';
import requestRoute from './routes/requestRoute.js';
import messageRoute from './routes/messageRoute.js';
import summaryRoutes from './routes/summaryRoute.js';
import paymentRoutes from './routes/paymentRoute.js';
import searchRoute from './routes/searchRoute.js';
import feedbackRoute from './routes/feedbackRoute.js';

// Import Webhook Controller
import { stripeWebhook } from './controllers/paymentController.js';

const app = express();

// 1. Global Security & CORS Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// 2. STRIPE WEBHOOK (CRITICAL: Must be registered BEFORE express.json())
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// 3. Global Body Parsers (For all routes EXCEPT the webhook above)
app.use(compression());
app.use(express.json());

// 4. Mount Standard API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/sessions', sessionRoute);
app.use('/api/matches', matchRouter);
app.use('/api/requests', requestRoute);
app.use('/api/messages', messageRoute);
app.use('/api/summary', summaryRoutes);
app.use('/api/payments', paymentRoutes); // Other payment routes
app.use('/api/search', searchRoute);
app.use('/api/feedback', feedbackRoute);

// 5. Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'BondEd API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`BondEd API server running on port ${PORT}`);
});