/**
 * Seed only the accounts — NO demo classes/tests.
 * All classes, documents and tests are created by tutors in the app.
 * Run: npm run seed   (from the /server folder)
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import LiveClass from '../models/Class.js';
import Test from '../models/Test.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

// In production, refuse to seed with the weak fallback passwords.
if (isProd) {
  for (const key of ['ADMIN_PASSWORD', 'MENTOR_PASSWORD']) {
    const v = process.env[key];
    if (!v || v.length < 8) {
      console.error(`❌ ${key} must be set (8+ chars) in server/.env before seeding in production.`);
      process.exit(1);
    }
  }
}

const run = async () => {
  await connectDB();
  console.log('🌱 Clearing old data...');
  await Promise.all([
    User.deleteMany(),
    LiveClass.deleteMany(),
    Test.deleteMany(),
    Post.deleteMany(),
    Notification.deleteMany(),
    Message.deleteMany(),
  ]);

  // --- Staff (credentials from .env; dev fallbacks below) ---
  const admin = await User.create({
    name: process.env.ADMIN_NAME || 'Admin',
    username: (process.env.ADMIN_USERNAME || 'admin').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'admin123',
    role: 'admin',
  });
  const mentor = await User.create({
    name: 'Mentor',
    username: (process.env.MENTOR_USERNAME || 'mentor').toLowerCase(),
    password: process.env.MENTOR_PASSWORD || 'mentor123',
    role: 'mentor',
  });

  // --- Demo tutor + student in the same cohort (created by the mentor). No classes/tests. ---
  const tutor = await User.create({
    name: 'Ravi Tutor', username: 'tutor', password: 'tutor123', role: 'tutor', createdBy: mentor._id,
  });
  await User.create({
    name: 'Aisha Student', username: 'student', password: 'student123', role: 'student',
    createdBy: mentor._id, assignedTutor: tutor._id, studentProfile: { mentor: mentor._id },
  });

  console.log('\n🎉 Seed complete!');
  console.log(`   Staff:   ${admin.username} (admin), ${mentor.username} (mentor)`);
  console.log('   Demo:    tutor (tutor), student (student) — student assigned to tutor');
  console.log('   Passwords come from server/.env (see .env.production.example). Demo user pw: tutor123 / student123.');
  if (!isProd) console.log('   Dev staff fallbacks are in .env — change ADMIN_PASSWORD / MENTOR_PASSWORD before production.');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
