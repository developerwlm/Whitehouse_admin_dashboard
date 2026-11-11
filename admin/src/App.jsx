
import React, { useEffect, useState } from 'react';
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams
} from 'react-router-dom';

import {
  api,
  clearSession,
  getToken,
  login,
  setSession,
  uploadImage
} from './api';

// ================= NAVIGATION =================

const NAV = [
  { to: '/', label: 'Overview', icon: '▦', end: true },
  { to: '/pages', label: 'Pages & SEO', icon: '▤' },
  { to: '/blogs', label: 'Blogs', icon: '✎' },
  { to: '/courses', label: 'Courses', icon: '▣' }
];

// ================= CONTENT CONFIGURATION =================

const CONFIG = {
  pages: {
    title: 'Website Pages',
    singular: 'Page',
    description: 'Manage page metadata and search visibility.',
    fields: [
      ['name', 'Page name', 'text', true],
      ['slug', 'Page slug', 'text', true],
      ['metaTitle', 'Meta title', 'text'],
      ['metaDescription', 'Meta description', 'textarea'],
      ['tags', 'SEO tags / keywords', 'tags']
    ]
  },

  blogs: {
    title: 'Blog Management',
    singular: 'Blog',
    description: 'Create, edit and publish articles for your Whitehouse public blog.',
    fields: [
      ['title', 'Blog title', 'text', true],
      ['slug', 'Blog slug', 'text', true],
      ['category', 'Category', 'text'],
      ['excerpt', 'Short description / Excerpt', 'textarea', true],
      ['image', 'Featured image', 'image'],
      ['imageAlt', 'Image alt text', 'text'],
      ['author', 'Author name', 'text'],
      ['readTime', 'Reading time (e.g. 4 min read)', 'text'],
      ['tags', 'Tags', 'tags'],
      ['content', 'Blog content', 'editor', true],
      ['status', 'Publishing status', 'status']
    ]
  },

  courses: {
    title: 'Course Management',
    singular: 'Course',
    description: 'Manage course information and public course details.',
    fields: [
      ['title', 'Course title', 'text', true],
      ['slug', 'Course slug', 'text', true],
      ['category', 'Category slug', 'text', true],
      ['categoryLabel', 'Category label', 'text'],
      ['summary', 'Short description / Summary', 'textarea', true],
      ['image', 'Course image', 'image'],
      ['alt', 'Image alt text', 'text'],
      ['level', 'Difficulty level', 'text'],
      ['duration', 'Course duration', 'text', true],
      ['mode', 'Learning mode', 'text'],
      ['batch', 'Batch', 'text'],
      ['language', 'Language', 'text'],
      ['certificate', 'Certificate', 'text'],
      ['intro', 'Course introduction', 'paragraphs'],
      ['outcomes', 'What you will learn', 'list'],
      ['skills', 'Skills you will build', 'list'],
      ['eligibility', 'Eligibility criteria', 'list'],
      ['careers', 'Career opportunities', 'list'],
      ['status', 'Publishing status', 'status']
    ]
  }
};

// ================= HELPERS =================

function slugify(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const COURSE_ARRAY_FIELDS = [
  'intro',
  'outcomes',
  'skills',
  'eligibility',
  'careers'
];

function textToArray(value = '') {
  if (Array.isArray(value)) return value;

  return String(value || '')
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);
}

function arrayToText(value) {
  return Array.isArray(value)
    ? value.join('\n')
    : value || '';
}

// ================= LOGIN =================

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError('');

    try {
      const data = await login(email, password);

      setSession(data.token, data.admin);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark">W</div>

        <p className="eyebrow">WHITEHOUSE ACADEMY</p>

        <h1>Admin sign in</h1>

        <p className="muted">
          Manage your website content in one place.
        </p>

        {error && (
          <div className="alert error">{error}</div>
        )}

        <label>
          Email address
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="username"
            placeholder="admin@whitehouse.in"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </label>

        <button className="primary full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in to dashboard'}
        </button>

        <p className="login-foot">
          Secure administrator access
        </p>
      </form>
    </main>
  );
}

// ================= ADMIN LAYOUT =================

function Shell({ children }) {
  const [mobile, setMobile] = useState(false);

  const navigate = useNavigate();

  const admin = JSON.parse(
    sessionStorage.getItem('wh_cms_admin') || '{}'
  );

  function logout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? 'show' : ''}`}>
        <div className="side-brand">
          <div className="brand-mark small">W</div>

          <div>
            <b>WHITEHOUSE</b>
            <small>CONTENT STUDIO</small>
          </div>
        </div>

        <div className="nav-caption">WORKSPACE</div>

        <nav>
          {NAV.map(nav => (
            <NavLink
              key={nav.to}
              to={nav.to}
              end={nav.end}
              onClick={() => setMobile(false)}
              className={({ isActive }) =>
                isActive ? 'nav-link active' : 'nav-link'
              }
            >
              <span>{nav.icon}</span>
              {nav.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <b>Need a hand?</b>
            <span>
              Content changes sync through your website API.
            </span>
          </div>

          <button className="nav-link logout" onClick={logout}>
            <span>↪</span>
            Sign out
          </button>
        </div>
      </aside>

      {mobile && (
        <div
          className="mobile-scrim"
          onClick={() => setMobile(false)}
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobile(!mobile)}
          >
            ☰
          </button>

          <div>
            <span className="crumb">Workspace</span>
            <span className="crumb-sep"> / </span>
            <b>Admin dashboard</b>
          </div>

          <div className="top-user">
            <span className="online-dot" />

            <span>
              {admin.email || 'Administrator'}
            </span>

            <div className="avatar">
              {(admin.email || 'A')
                .slice(0, 1)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}

// ================= DASHBOARD =================

function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/admin/dashboard')
      .then(setData)
      .catch(err => setError(err.message));
  }, []);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>

          <h1>Good day, welcome back.</h1>

          <p className="muted">
            Here's what's happening across your Whitehouse website.
          </p>
        </div>

        <span className="date-pill">● CMS connected</span>
      </div>

      {error && (
        <div className="alert error">{error}</div>
      )}

      <div className="stats-grid">
        {[
          ['Total pages', data?.stats?.pages, '▤', 'blue'],
          ['Total blogs', data?.stats?.blogs, '✎', 'violet'],
          ['Total courses', data?.stats?.courses, '▣', 'orange'],
          [
            'Published content',
            (data?.stats?.publishedBlogs || 0) +
              (data?.stats?.publishedCourses || 0),
            '✓',
            'green'
          ]
        ].map(([label, value, icon, color]) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}>
              {icon}
            </div>

            <span>{label}</span>

            <strong>{value ?? '—'}</strong>

            <small>Stored in CMS database</small>
          </div>
        ))}
      </div>

      <section className="panel activity-panel">
        <div className="panel-head">
          <div>
            <h2>Recent activity</h2>

            <p className="muted">
              Latest content changes by administrators
            </p>
          </div>
        </div>

        {data?.activities?.length ? (
          <div className="activity-list">
            {data.activities.map(activity => (
              <div
                className="activity-row"
                key={activity._id}
              >
                <div className="activity-dot" />

                <div>
                  <b>
                    {activity.entityTitle || 'Content'}
                  </b>

                  <span>
                    {activity.action} · {activity.entityType}
                  </span>
                </div>

                <time>
                  {new Date(
                    activity.createdAt
                  ).toLocaleString()}
                </time>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            {data
              ? 'No activity yet. Create a page, blog or course to get started.'
              : 'Loading activity…'}
          </div>
        )}
      </section>

      <div className="quick-grid">
        {[
          [
            '/pages',
            'Manage page SEO',
            'Edit titles, descriptions and keywords.'
          ],
          [
            '/blogs',
            'Write a blog',
            'Create drafts and publish articles.'
          ],
          [
            '/courses',
            'Update courses',
            'Manage course details and images.'
          ]
        ].map(([to, title, description]) => (
          <NavLink className="quick-card" to={to} key={to}>
            <b>{title} ↗</b>
            <span>{description}</span>
          </NavLink>
        ))}
      </div>
    </>
  );
}

// ================= RICH TEXT EDITOR =================

function RichEditor({ value, onChange }) {
  const ref = React.useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const command = (cmd, arg) => {
    ref.current?.focus();

    document.execCommand(cmd, false, arg);

    onChange(ref.current?.innerHTML || '');
  };

  return (
    <div className="rich-wrap">
      <div className="editor-toolbar">
        <button type="button" onClick={() => command('bold')}>
          <b>B</b>
        </button>

        <button type="button" onClick={() => command('italic')}>
          <i>I</i>
        </button>

        <button type="button" onClick={() => command('underline')}>
          <u>U</u>
        </button>

        <i />

        <select
          aria-label="Heading"
          defaultValue="p"
          onChange={e => command('formatBlock', e.target.value)}
        >
          <option value="p">Paragraph</option>

          {[1, 2, 3, 4, 5, 6].map(number => (
            <option value={`h${number}`} key={number}>
              Heading {number}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => command('insertUnorderedList')}
        >
          • List
        </button>

        <button
          type="button"
          onClick={() => command('insertOrderedList')}
        >
          1. List
        </button>

        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Enter link URL');

            if (url) command('createLink', url);
          }}
        >
          ↗ Link
        </button>

        <button
          type="button"
          onClick={() => {
            const url = window.prompt(
              'Enter image URL (Cloudinary URL recommended)'
            );

            if (url) command('insertImage', url);
          }}
        >
          ▧ Image
        </button>

        <button
          type="button"
          onClick={() => command('justifyLeft')}
        >
          ≡
        </button>

        <button
          type="button"
          onClick={() => command('justifyCenter')}
        >
          ☰
        </button>

        <button
          type="button"
          onClick={() => command('justifyRight')}
        >
          ≡
        </button>
      </div>

      <div
        ref={ref}
        className="rich-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={e => onChange(e.currentTarget.innerHTML)}
        data-placeholder="Write your article here…"
      />
    </div>
  );
}

// ================= FORM FIELD =================

function Field({
  field,
  value,
  onChange,
  form,
  setForm
}) {
  const [key, label, type, required] = field;

  // Status dropdown
  if (type === 'status') {
    return (
      <label>
        {label}

        <select
          value={value || 'draft'}
          onChange={e => onChange(e.target.value)}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
    );
  }

  // Tags input
  if (type === 'tags') {
    return (
      <label>
        {label}

        <input
          value={
            Array.isArray(value)
              ? value.join(', ')
              : value || ''
          }
          onChange={e =>
            onChange(
              e.target.value.split(',').map(x => x.trimStart())
            )
          }
          placeholder="Separate values with commas"
        />

        <small className="field-hint">
          Separate each item with a comma.
        </small>
      </label>
    );
  }

  // Rich text editor
  if (type === 'editor') {
    return (
      <label className="wide-field">
        {label}

        <RichEditor
          value={value || ''}
          onChange={onChange}
        />
      </label>
    );
  }

  // Course arrays and introduction paragraphs
  if (type === 'list' || type === 'paragraphs') {
    return (
      <label className="wide-field">
        {label}

        <textarea
          rows={5}
          value={arrayToText(value)}
          required={required}
          onChange={e => onChange(e.target.value)}
          placeholder={
            type === 'paragraphs'
              ? 'Enter each paragraph on a new line'
              : 'Enter each item on a new line'
          }
        />

        <small className="field-hint">
          Enter each {type === 'paragraphs' ? 'paragraph' : 'item'} on a new line.
        </small>
      </label>
    );
  }

  // Normal textarea
  if (type === 'textarea') {
    return (
      <label className="wide-field">
        {label}

        <textarea
          rows={key === 'metaDescription' ? 3 : 4}
          value={value || ''}
          required={required}
          onChange={e => onChange(e.target.value)}
        />

        {key === 'metaDescription' && (
          <small className="field-hint">
            {(value || '').length}/170 characters recommended.
          </small>
        )}
      </label>
    );
  }

  // Image upload
  if (type === 'image') {
    return (
      <label className="wide-field">
        {label}

        <input
          value={value || ''}
          required={required}
          onChange={e => onChange(e.target.value)}
          placeholder="Image URL or upload below"
        />

        <div className="upload-line">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={async e => {
              const file = e.target.files?.[0];

              if (!file) return;

              try {
                const result = await uploadImage(file);
                onChange(result.url);
              } catch (err) {
                alert(err.message);
              }

              e.target.value = '';
            }}
          />

          <span>Upload to Cloudinary · max 5 MB</span>
        </div>

        {value && (
          <img
            className="image-preview"
            src={value}
            alt="Preview"
          />
        )}
      </label>
    );
  }

  // Normal input
  return (
    <label>
      {label}

      <input
        value={value || ''}
        required={required}
        onChange={e => {
          const newValue = e.target.value;

          onChange(newValue);

          if (key === 'title' || key === 'name') {
            if (
              !form.slug ||
              form.slug === slugify(form.title || form.name)
            ) {
              setForm(old => ({
                ...old,
                slug: slugify(newValue)
              }));
            }
          }
        }}
        placeholder={
          key === 'slug' ? 'example-page-slug' : ''
        }
      />
    </label>
  );
}

// ================= CONTENT MANAGER =================

function ContentManager() {
  const { type } = useParams();

  const cfg = CONFIG[type];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Load content
  async function load() {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '10',
        search
      });

      if (statusFilter) {
        query.set('status', statusFilter);
      }

      const data = await api(
        `/api/admin/${type}?${query}`
      );

      setItems(data.items || []);
      setPages(data.pagination?.pages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [type, page, search, statusFilter]);

  useEffect(() => {
    setPage(1);
    setEditing(null);
  }, [type]);

  // Create new content
  function startNew() {
    setEditing(
      type === 'pages'
        ? {
            name: '',
            slug: '',
            metaTitle: '',
            metaDescription: '',
            tags: []
          }
        : type === 'blogs'
        ? {
            title: '',
            slug: '',
            category: 'General',
            excerpt: '',
            image: '',
            imageAlt: '',
            author: 'Whitehouse Team',
            readTime: '',
            tags: [],
            content: '',
            status: 'draft'
          }
        : {
            title: '',
            slug: '',
            category: 'coding',
            categoryLabel: 'Coding',
            summary: '',
            image: '',
            alt: '',
            level: 'Beginner',
            duration: '',
            mode: 'Offline',
            batch: '',
            language: 'English & Tamil',
            certificate: '',
            intro: '',
            outcomes: '',
            skills: '',
            eligibility: '',
            careers: '',
            status: 'draft'
          }
    );
  }

  // Save new or edited content
  async function save(e) {
    e.preventDefault();

    setSaving(true);
    setError('');

    try {
      const payload = { ...editing };

      // Convert course text fields to arrays
      if (type === 'courses') {
        COURSE_ARRAY_FIELDS.forEach(key => {
          payload[key] = textToArray(payload[key]);
        });
      }

      // Convert tags and features to backend format
      if (Array.isArray(payload.tags)) {
        payload.tags = payload.tags.join(',');
      }

      if (Array.isArray(payload.features)) {
        payload.features = payload.features.join(',');
      }

      const isEdit = Boolean(editing._id);

      await api(
        `/api/admin/${type}${isEdit ? `/${editing._id}` : ''}`,
        {
          method: isEdit ? 'PUT' : 'POST',
          body: JSON.stringify(payload)
        }
      );

      setEditing(null);

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Delete content
  async function remove(item) {
    const confirmed = window.confirm(
      `Delete "${item.title || item.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api(
        `/api/admin/${type}/${item._id}`,
        { method: 'DELETE' }
      );

      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  // Edit existing content
  function editItem(item) {
    const editableItem = {
      ...item,
      tags: Array.isArray(item.tags)
        ? item.tags.join(',')
        : item.tags || '',
      features: Array.isArray(item.features)
        ? item.features.join(',')
        : item.features || ''
    };

    if (type === 'courses') {
      COURSE_ARRAY_FIELDS.forEach(key => {
        editableItem[key] = arrayToText(editableItem[key]);
      });
    }

    setEditing(editableItem);
  }

  if (!cfg) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CONTENT MANAGEMENT</p>

          <h1>{cfg.title}</h1>

          <p className="muted">{cfg.description}</p>
        </div>

        <button className="primary" onClick={startNew}>
          ＋ Add {cfg.singular}
        </button>
      </div>

      {error && (
        <div className="alert error">{error}</div>
      )}

      <section className="panel">
        <div className="list-tools">
          <div className="search-box">
            <span>⌕</span>

            <input
              placeholder={`Search ${type} by title or slug…`}
              value={search}
              onChange={e => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>

          {type !== 'pages' && (
            <select
              className="filter-select"
              value={statusFilter}
              onChange={e => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
            >
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          )}
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>CONTENT</th>
                <th>SLUG</th>
                <th>
                  {type === 'pages' ? 'SEO TITLE' : 'STATUS'}
                </th>
                <th>UPDATED</th>
                <th className="align-right">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    Loading content…
                  </td>
                </tr>
              ) : items.length ? (
                items.map(item => (
                  <tr key={item._id}>
                    <td>
                      <div className="item-cell">
                        {(item.image || item.featuredImage) && (
                          <img
                            src={item.image || item.featuredImage}
                            alt=""
                          />
                        )}

                        <div>
                          <b>{item.title || item.name}</b>

                          <small>
                            {item.excerpt ||
                              item.summary ||
                              item.description ||
                              item.shortDescription ||
                              item.metaDescription ||
                              '—'}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <code>/{item.slug}</code>
                    </td>

                    <td>
                      {type === 'pages' ? (
                        <span className="meta-preview">
                          {item.metaTitle || 'Not set'}
                        </span>
                      ) : (
                        <span className={`status ${item.status}`}>
                          {item.status}
                        </span>
                      )}
                    </td>

                    <td>
                      {new Date(
                        item.updatedAt || item.createdAt
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      <div className="actions">
                        <button onClick={() => editItem(item)}>
                          Edit
                        </button>

                        <button
                          className="danger-text"
                          onClick={() => remove(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No {type} found. Add your first{' '}
                    {cfg.singular.toLowerCase()}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-foot">
          <span>
            {items.length} shown · Page {page} of {Math.max(1, pages)}
          </span>

          <div>
            <button
              disabled={page <= 1}
              onClick={() => setPage(current => current - 1)}
            >
              Previous
            </button>

            <button
              disabled={page >= pages}
              onClick={() => setPage(current => current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* CREATE / EDIT MODAL */}

      {editing && (
        <div
          className="modal-backdrop"
          onMouseDown={e => {
            if (
              e.target === e.currentTarget &&
              !saving
            ) {
              setEditing(null);
            }
          }}
        >
          <form className="edit-modal" onSubmit={save}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">
                  {editing._id ? 'UPDATE' : 'CREATE'}{' '}
                  {cfg.singular.toUpperCase()}
                </p>

                <h2>
                  {editing._id ? 'Edit' : 'New'} {cfg.singular}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setEditing(null)}
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              {cfg.fields.map(field => (
                <Field
                  key={field[0]}
                  field={field}
                  value={editing[field[0]]}
                  form={editing}
                  setForm={setEditing}
                  onChange={value =>
                    setEditing(old => ({
                      ...old,
                      [field[0]]: value
                    }))
                  }
                />
              ))}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(null)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="primary"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

// ================= ROUTING =================

function Protected() {
  return getToken() ? (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/:type" element={<ContentManager />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  ) : (
    <Navigate to="/login" replace />
  );
}

// ================= MAIN APP =================

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          getToken()
            ? <Navigate to="/" replace />
            : <Login />
        }
      />

      <Route path="/*" element={<Protected />} />
    </Routes>
  );
}
