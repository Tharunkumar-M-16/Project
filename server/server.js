import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import readyScoreRoutes from './routes/readyScoreRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import classRoutes from './routes/classRoutes.js';
import postRoutes from './routes/postRoutes.js';
import testRoutes from './routes/testRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config({ path: path.join(__dirname, '.env') });
connectDB();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'ReadyScore API' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/readyscore', readyScoreRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

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
app.listen(PORT, () => console.log(`🚀 ReadyScore running on port ${PORT} (${process.env.NODE_ENV || 'development'})`));
