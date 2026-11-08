import { SITE_NAME } from './seo.ts';

export function homeJsonLd(origin: URL): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': new URL('/#website', origin).href,
    name: SITE_NAME,
    url: new URL('/', origin).href,
  });
}
