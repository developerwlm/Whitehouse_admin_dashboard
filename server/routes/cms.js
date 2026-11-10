import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import sanitizeHtml from 'sanitize-html';
import { Admin, Page, Blog, Course, Activity } from '../models/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
const collections = { pages: Page, blogs: Blog, courses: Course };
const labels = { pages: 'Page', blogs: 'Blog', courses: 'Course' };
const slugify = (value = '') => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const splitTags = (value) => Array.isArray(value) ? value : String(value || '').split(',').map(x => x.trim()).filter(Boolean);
const cleanRichContent = (html = '') => sanitizeHtml(String(html), { allowedTags: [...sanitizeHtml.defaults.allowedTags, 'h1','h2','h3','h4','h5','h6','img','u','s','span'], allowedAttributes: { a: ['href','name','target','rel'], img: ['src','alt','width','height'], '*': ['style'] }, allowedStyles: { '*': { 'text-align': [/^(left|right|center|justify)$/], 'color': [/^#[0-9a-f]{3,8}$/i], 'background-color': [/^#[0-9a-f]{3,8}$/i] } }, allowedSchemes: ['http','https','mailto'] });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) });

router.post('/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const admin = await Admin.findOne({ email });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  const token = jwt.sign({ sub: admin._id.toString(), role: admin.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  res.json({ success: true, token, admin: { email: admin.email } });
});

router.use(requireAdmin);

router.get('/dashboard', async (_req, res) => {
  const [pages, blogs, courses, publishedBlogs, publishedCourses, activities] = await Promise.all([
    Page.countDocuments(), Blog.countDocuments(), Course.countDocuments(), Blog.countDocuments({ status: 'published' }), Course.countDocuments({ status: 'published' }), Activity.find().sort({ createdAt: -1 }).limit(8).lean()
  ]);
  res.json({ success: true, stats: { pages, blogs, courses, publishedBlogs, publishedCourses }, activities });
});

router.get('/:type', async (req, res, next) => {
  try {
    const Model = collections[req.params.type];
    if (!Model) return res.status(404).json({ success: false, message: 'Unknown content type.' });
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const search = String(req.query.search || '').trim();
    const filter = {};
    if (req.query.status && req.params.type !== 'pages') filter.status = req.query.status;
    if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }, { slug: { $regex: search, $options: 'i' } }];
    const [items, total] = await Promise.all([Model.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Model.countDocuments(filter)]);
    res.json({ success: true, items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.post('/:type', async (req, res, next) => {
  try {
    const Model = collections[req.params.type];
    if (!Model) return res.status(404).json({ success: false, message: 'Unknown content type.' });
    const data = { ...req.body };
    const title = data.title || data.name;
    data.slug = slugify(data.slug || title);
    if (!data.slug) return res.status(400).json({ success: false, message: 'A title and slug are required.' });
    if (req.params.type === 'blogs') { data.tags = splitTags(data.tags); data.content = cleanRichContent(data.content); data.excerpt = data.excerpt ?? data.description ?? ''; data.image = data.image ?? data.featuredImage ?? ''; data.description = data.excerpt; data.featuredImage = data.image; }
    if (req.params.type === 'pages') data.tags = splitTags(data.tags);
    if (req.params.type === 'courses') data.features = splitTags(data.features);
    if (req.params.type === 'blogs' && data.status === 'published' && !data.publishedAt) data.publishedAt = new Date();
    const item = await Model.create(data);
    await Activity.create({ action: 'created', entityType: labels[req.params.type], entityTitle: title, adminEmail: req.admin.email });
    res.status(201).json({ success: true, item });
  } catch (error) { if (error.code === 11000) return res.status(409).json({ success: false, message: 'That slug is already in use. Please choose another.' }); next(error); }
});

router.put('/:type/:id', async (req, res, next) => {
  try {
    const Model = collections[req.params.type];
    if (!Model) return res.status(404).json({ success: false, message: 'Unknown content type.' });
    const data = { ...req.body };
    if (data.slug || data.title || data.name) data.slug = slugify(data.slug || data.title || data.name);
    if (req.params.type === 'blogs' || req.params.type === 'pages') if (data.tags !== undefined) data.tags = splitTags(data.tags);
    if (req.params.type === 'blogs') { if (data.content !== undefined) data.content = cleanRichContent(data.content); if (data.excerpt !== undefined || data.description !== undefined) { data.excerpt = data.excerpt ?? data.description; data.description = data.excerpt; } if (data.image !== undefined || data.featuredImage !== undefined) { data.image = data.image ?? data.featuredImage; data.featuredImage = data.image; } }
    if (req.params.type === 'courses' && data.features !== undefined) data.features = splitTags(data.features);
    if (req.params.type === 'blogs' && data.status === 'published') data.publishedAt ||= new Date();
    const item = await Model.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Content not found.' });
    await Activity.create({ action: 'updated', entityType: labels[req.params.type], entityTitle: item.title || item.name, adminEmail: req.admin.email });
    res.json({ success: true, item });
  } catch (error) { if (error.code === 11000) return res.status(409).json({ success: false, message: 'That slug is already in use.' }); next(error); }
});

router.delete('/:type/:id', async (req, res, next) => {
  try {
    const Model = collections[req.params.type];
    if (!Model) return res.status(404).json({ success: false, message: 'Unknown content type.' });
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Content not found.' });
    await Activity.create({ action: 'deleted', entityType: labels[req.params.type], entityTitle: item.title || item.name, adminEmail: req.admin.email });
    res.json({ success: true, message: 'Content deleted.' });
  } catch (error) { next(error); }
});

router.post('/media/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Choose an image (JPG, PNG, WEBP or GIF, max 5 MB).' });
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) return res.status(503).json({ success: false, message: 'Cloudinary is not configured on the server.' });
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
  try {
    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, { folder: 'whitehouse-cms' });
    res.json({ success: true, url: result.secure_url, publicId: result.public_id });
  } catch (error) { res.status(502).json({ success: false, message: error.message || 'Image upload failed.' }); }
});

export default router;
