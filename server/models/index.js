import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  metaTitle: { type: String, default: '', maxlength: 70 },
  metaDescription: { type: String, default: '', maxlength: 170 },
  tags: { type: [String], default: [] },
}, { timestamps: true });

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // Public Blog.jsx field names
  excerpt: { type: String, default: '' },
  image: { type: String, default: '' },
  imageAlt: { type: String, default: '' },
  author: { type: String, default: 'Whitehouse Team' },
  readTime: { type: String, default: '' },
  content: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  category: { type: String, default: 'General' },
  tags: { type: [String], default: [] },
  // Legacy aliases retained for older blog records/integrations
  description: { type: String, default: '' },
  featuredImage: { type: String, default: '' },
  publishedAt: Date,
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  shortDescription: { type: String, default: '' },
  fullDescription: { type: String, default: '' },
  image: { type: String, default: '' },
  duration: { type: String, default: '' },
  category: { type: String, default: 'General' },
  features: { type: [String], default: [] },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin'], default: 'admin' },
}, { timestamps: true });

const activitySchema = new mongoose.Schema({
  action: String, entityType: String, entityTitle: String, adminEmail: String,
}, { timestamps: true });

export const Page = mongoose.model('Page', pageSchema);
export const Blog = mongoose.model('Blog', blogSchema);
export const Course = mongoose.model('Course', courseSchema);
export const Admin = mongoose.model('Admin', adminSchema);
export const Activity = mongoose.model('Activity', activitySchema);
