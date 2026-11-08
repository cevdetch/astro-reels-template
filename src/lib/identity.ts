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

export function sonnetJsonLd(input: { url: string; name: string; description: string }): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${input.url}#work`,
    name: input.name,
    description: input.description,
    inLanguage: 'en',
    url: input.url,
    author: { '@type': 'Person', name: 'William Shakespeare' },
    isPartOf: { '@type': 'Book', name: "Shakespeare's Sonnets", datePublished: '1609' },
  });
}
