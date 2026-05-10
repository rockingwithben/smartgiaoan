import React from 'react';
import { Helmet } from 'react-helmet';

export function SEO({ title, description, keywords, ogTitle, ogDescription, ogUrl, ogImage, twitterTitle, twitterDescription, twitterImage }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:title" content={twitterTitle || ogTitle || title} />
      <meta name="twitter:description" content={twitterDescription || ogDescription || description} />
      <meta name="twitter:image" content={twitterImage || ogImage} />
    </Helmet>
  );
}

export default SEO;