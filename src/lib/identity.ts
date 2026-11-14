import { siteConfig, type SiteConfig } from '../config.ts';
import { SITE_NAME } from './seo.ts';
import { creativeWorkNode, graph, serializeJsonLd, websiteNode } from './structured-data.ts';

/** The home page's WebSite, published by the configured author; with no author, it names no publisher. */
export function homeJsonLd(origin: URL, { author }: Pick<SiteConfig, 'author'> = siteConfig): string {
  return serializeJsonLd(graph(websiteNode({
    url: new URL('/', origin).href, name: SITE_NAME, inLanguage: 'en', publisher: author ?? null,
  })));
}

/** A piece's page. The pieces are Shakespeare's: change the author and the book along with them. */
export function sonnetJsonLd(input: { url: string; name: string; description: string }): string {
  return serializeJsonLd(graph(creativeWorkNode({
    ...input,
    inLanguage: 'en',
    author: { '@type': 'Person', name: 'William Shakespeare' },
    partOf: { '@type': 'Book', name: "Shakespeare's Sonnets", datePublished: '1609' },
  })));
}
