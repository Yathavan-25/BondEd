import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Import Routes
import authRoutes from './routes/authRoute.js';
import profileRoutes from './routes/profileRoute.js';
import dashboardRoute from './routes/dashboardRoute.js'
import sessionRoute from './routes/sessionRoute.js'
import matchRouter from './routes/matchRoute.js'
import requestRoute from './routes/requestRoute.js'
import messageRoute from './routes/messageRoute.js'
import summaryRoutes from './routes/summaryRoute.js'

const app = express();

// Apply Global Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' }));
app.use(compression());
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/sessions', sessionRoute);
app.use('/api/matches', matchRouter);
app.use('/api/requests', requestRoute);
app.use('/api/messages', messageRoute);
app.use('/api/summary', summaryRoutes)

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'BondEd API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`BondEd API server running on port ${PORT}`);
});