# Connect the existing Whitehouse public React website

The admin app and public website must use the same deployed CMS API URL. Add this to the public website `.env` (Create React App):

```env
REACT_APP_API_BASE_URL=http://localhost:4000
```

Restart the public React development server after changing `.env`.

Copy `contentApi.js` into `src/services/contentApi.js` in the public website. Then update the existing pages:

## Blog list
Replace the hard-coded blog source / existing blog fetch with:

```js
import { getPublishedBlogs } from '../services/contentApi';
// inside useEffect:
getPublishedBlogs().then(setBlogs).catch(setError);
```

CMS blog fields: `title`, `slug`, `description`, `featuredImage`, `content`, `category`, `tags`, `publishedAt`. If the current public Blog component expects `excerpt` or `image`, map `description` to `excerpt` and `featuredImage` to `image`, or update the component to use the CMS names.

## Course list
Fetch `getPublishedCourses()` in the Courses page and render the returned published records. CMS fields: `title`, `slug`, `shortDescription`, `fullDescription`, `image`, `duration`, `category`, `features`. Do not remove existing course detail sections or styling: map the API fields into the shape the current course cards/detail page expects.

## Course detail
Use `getPublishedCourse(slug)` to load the course matching the URL slug. Show a not-found state if it is not published or does not exist.

## SEO metadata
Call `getPageSeo('home')`, `getPageSeo('about')`, `getPageSeo('courses')`, etc. Use `page.metaTitle`, `page.metaDescription`, and `page.tags` to update `document.title` and description/keywords meta tags. Page records must first be created in the CMS with matching slugs.

## Important
The CMS backend includes backward-compatible `GET /api/blogs` and `GET /api/blogs/:slug` endpoints, so the existing blog API path can continue to work once blog records are stored in MongoDB. Course data is currently hard-coded in the supplied website (`src/data/courses.js`); it will not become dynamic until the Courses and CourseDetails pages are changed to fetch the public course endpoints. This integration guide identifies the exact changes but does not silently rewrite your public site UI.
