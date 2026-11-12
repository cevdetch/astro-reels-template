import { siteConfig, type SiteConfig } from '../config.ts';
import { SITE_NAME } from './seo.ts';

/** The site's author as a schema.org Person, identified by `#person` on their own home page. */
export function publisher(author: SiteConfig['author']): Record<string, string> | undefined {
  if (!author) return undefined;
  return author.url
    ? { '@type': 'Person', '@id': new URL('#person', author.url).href, name: author.name, url: author.url }
    : { '@type': 'Person', name: author.name };
}

export function homeJsonLd(origin: URL): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': new URL('/#website', origin).href,
    name: SITE_NAME,
    url: new URL('/', origin).href,
    publisher: publisher(siteConfig.author),
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
