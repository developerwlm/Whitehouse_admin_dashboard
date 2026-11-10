import { Router } from 'express';
import { Page, Blog, Course } from '../models/index.js';
const router = Router();
const presentBlog = (blog) => ({ ...blog, excerpt: blog.excerpt || blog.description || '', image: blog.image || blog.featuredImage || '', imageAlt: blog.imageAlt || blog.title || 'Whitehouse blog image', author: blog.author || 'Whitehouse Team', readTime: blog.readTime || `${Math.max(1, Math.ceil(String(blog.content || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length / 200))} min read` });

router.get('/pages/:slug', async (req, res, next) => {
  try {
    const page = await Page.findOne({ slug: req.params.slug }).lean();
    if (!page) return res.status(404).json({ success: false, message: 'Page SEO not found.' });
    res.json({ success: true, page });
  } catch (error) { next(error); }
});
router.get('/blogs', async (_req, res, next) => {
  try { res.json((await Blog.find({ status: 'published' }).sort({ publishedAt: -1, createdAt: -1 }).lean()).map(presentBlog)); }
  catch (error) { next(error); }
});
router.get('/blogs/:slug', async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found.' });
    res.json(presentBlog(blog));
  } catch (error) { next(error); }
});
router.get('/courses', async (_req, res, next) => {
  try { res.json(await Course.find({ status: 'published' }).sort({ updatedAt: -1 }).lean()); }
  catch (error) { next(error); }
});
router.get('/courses/:slug', async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    res.json(course);
  } catch (error) { next(error); }
});
export default router;
