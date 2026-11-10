import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Admin } from '../models/index.js';

if (!process.env.MONGODB_URI || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  throw new Error('Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env');
}
await mongoose.connect(process.env.MONGODB_URI);
const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
await Admin.findOneAndUpdate(
  { email: process.env.ADMIN_EMAIL.toLowerCase() },
  { email: process.env.ADMIN_EMAIL.toLowerCase(), passwordHash, role: 'admin' },
  { upsert: true, new: true, setDefaultsOnInsert: true }
);
console.log(`Admin account ready: ${process.env.ADMIN_EMAIL}`);
await mongoose.disconnect();
