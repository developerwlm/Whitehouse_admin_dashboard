const BASE = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
export const getToken = () => sessionStorage.getItem('wh_cms_token');
export const setSession = (token, admin) => { sessionStorage.setItem('wh_cms_token', token); sessionStorage.setItem('wh_cms_admin', JSON.stringify(admin)); };
export const clearSession = () => { sessionStorage.removeItem('wh_cms_token'); sessionStorage.removeItem('wh_cms_admin'); };
export async function api(path, options = {}) {
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}), ...(options.headers || {}) };
  const response = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    if (response.status === 401) clearSession();
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}
export const login = (email, password) => api('/api/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export async function uploadImage(file) { const body = new FormData(); body.append('image', file); return api('/api/admin/media/upload', { method: 'POST', body }); }
