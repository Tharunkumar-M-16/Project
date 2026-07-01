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
import Notification from '../models/Notification.js';

dotenv.config();

const run = async () => {
  await connectDB();
  console.log('🌱 Clearing old data...');
  await Promise.all([User.deleteMany(), LiveClass.deleteMany(), Test.deleteMany(), Notification.deleteMany()]);

  // --- Staff (credentials from .env) ---
  const admin = await User.create({
    name: process.env.ADMIN_NAME || 'Admin',
    username: (process.env.ADMIN_USERNAME || 'admin').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'admin123',
    role: 'admin',
  });
  const mentor = await User.create({
    name: process.env.MENTOR_NAME || 'Mentor',
    username: (process.env.MENTOR_USERNAME || 'rishi').toLowerCase(),
    password: process.env.MENTOR_PASSWORD || '123',
    role: 'mentor',
  });
  console.log(`✅ Staff created: admin (${admin.username}) + mentor (${mentor.username})`);

  // --- One demo tutor + student (created by the mentor). No classes/tests. ---
  await User.create({
    name: 'Ravi Tutor', username: 'tutor', password: 'tutor123', role: 'tutor', createdBy: mentor._id,
  });
  await User.create({
    name: 'Aisha Student', username: 'student', password: 'student123', role: 'student', createdBy: mentor._id,
  });
  console.log('✅ Demo tutor (tutor/tutor123) + student (student/student123) created');

  console.log('\n🎉 Seed complete! Classes are created by tutors in the app.');
  console.log('   STAFF (hidden /manual-login):');
  console.log(`      admin  → ${admin.username} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
  console.log(`      mentor → ${mentor.username} / ${process.env.MENTOR_PASSWORD || '123'}`);
  console.log('   USERS (normal /login):');
  console.log('      tutor   → tutor / tutor123');
  console.log('      student → student / student123');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
