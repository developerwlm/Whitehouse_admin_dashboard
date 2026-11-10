const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Content request failed (${response.status})`);
  return data;
}

// Use these functions in the public React website instead of hard-coded CMS content.
export const getPublishedBlogs = () => request('/api/public/blogs');
export const getPublishedBlog = (slug) => request(`/api/public/blogs/${encodeURIComponent(slug)}`);
export const getPublishedCourses = () => request('/api/public/courses');
export const getPublishedCourse = (slug) => request(`/api/public/courses/${encodeURIComponent(slug)}`);
export const getPageSeo = (slug) => request(`/api/public/pages/${encodeURIComponent(slug)}`);
