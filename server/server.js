import 'express-async-errors'; // route errors from async handlers to the error middleware
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { assertAuthConfig } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import classRoutes from './routes/classRoutes.js';
import postRoutes from './routes/postRoutes.js';
import testRoutes from './routes/testRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import eventsRoutes from './routes/eventsRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config({ path: path.join(__dirname, '.env') });
assertAuthConfig(); // fail fast if JWT_SECRET is missing/weak
connectDB();

const app = express();
app.set('trust proxy', 1); // behind nginx — needed for correct client IP (rate limiting)

// --- Security & parsing ---
app.use(helmet());
const clientUrl = process.env.CLIENT_URL;
app.use(
  cors({
    // In production the SPA is same-origin; only allow an explicit CLIENT_URL (never '*').
    origin: process.env.NODE_ENV === 'production' ? clientUrl || false : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize()); // strip $ and . from request payloads (NoSQL-injection guard)

// --- Rate limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.originalUrl.startsWith('/api/events'), // don't throttle the SSE stream
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);

// Uploaded files (post attachments) — served both in dev and production.
// Force a download and disable content-type sniffing so a user-uploaded file
// can never be executed inline on the app origin (stored-XSS guard).
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: '5Rings Class API' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/uploads', uploadRoutes);

// In production, serve the built React app and let the SPA handle client routes.
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next(); // let API 404s fall through
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`🚀 5Rings Class running on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
);

// Graceful shutdown so PM2 restarts don't cut in-flight requests dead.
const shutdown = () => {
  console.log('Shutting down…');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
