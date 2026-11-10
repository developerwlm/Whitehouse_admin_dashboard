import { useEffect } from 'react';
import { getPageSeo } from './contentApi';

// Example hook: use it inside each existing public page, e.g. usePageSeo('home').
export function usePageSeo(slug) {
  useEffect(() => {
    let active = true;
    getPageSeo(slug).then(({ page }) => {
      if (!active || !page) return;
      if (page.metaTitle) document.title = page.metaTitle;
      const setMeta = (name, content) => {
        if (!content) return;
        let element = document.querySelector(`meta[name="${name}"]`);
        if (!element) { element = document.createElement('meta'); element.name = name; document.head.appendChild(element); }
        element.content = content;
      };
      setMeta('description', page.metaDescription);
      setMeta('keywords', Array.isArray(page.tags) ? page.tags.join(', ') : page.tags);
    }).catch(() => {});
    return () => { active = false; };
  }, [slug]);
}
