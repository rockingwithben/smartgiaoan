import { useEffect } from 'react';

function setMetaAttribute(selector, attribute, value) {
  if (!value) return;

  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    const match = selector.match(/\[(name|property)="([^"]+)"\]/);
    if (match) {
      element.setAttribute(match[1], match[2]);
    }
    document.head.appendChild(element);
  }
  element.setAttribute(attribute, value);
}

export function SEO({ title, description, keywords, ogTitle, ogDescription, ogUrl, ogImage, twitterTitle, twitterDescription, twitterImage }) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    setMetaAttribute('meta[name="description"]', 'content', description);
    setMetaAttribute('meta[name="keywords"]', 'content', keywords);
    setMetaAttribute('meta[property="og:title"]', 'content', ogTitle || title);
    setMetaAttribute('meta[property="og:description"]', 'content', ogDescription || description);
    setMetaAttribute('meta[property="og:url"]', 'content', ogUrl);
    setMetaAttribute('meta[property="og:image"]', 'content', ogImage);
    setMetaAttribute('meta[name="twitter:title"]', 'content', twitterTitle || ogTitle || title);
    setMetaAttribute('meta[name="twitter:description"]', 'content', twitterDescription || ogDescription || description);
    setMetaAttribute('meta[name="twitter:image"]', 'content', twitterImage || ogImage);
  }, [title, description, keywords, ogTitle, ogDescription, ogUrl, ogImage, twitterTitle, twitterDescription, twitterImage]);

  return null;
}

export default SEO;
