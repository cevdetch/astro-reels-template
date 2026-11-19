import { siteConfig, type SiteConfig } from '../config.ts';
import { SITE_NAME } from './seo.ts';
import { creativeWorkNode, graph, serializeJsonLd, websiteNode } from './structured-data.ts';

/** The home page's WebSite, published by the configured author; with no author, it names no publisher. */
export function homeJsonLd(origin: URL, { author }: Pick<SiteConfig, 'author'> = siteConfig): string {
  return serializeJsonLd(graph(websiteNode({
    url: new URL('/', origin).href, name: SITE_NAME, inLanguage: 'en', publisher: author ?? null,
  })));
}

/** A piece's page, by the configured creator. The book is Shakespeare's: change it along with the pieces. */
export function pieceJsonLd(input: { url: string; name: string; description: string }, { pieces }: { pieces: Pick<SiteConfig['pieces'], 'creator'> } = siteConfig): string {
  return serializeJsonLd(graph(creativeWorkNode({
    ...input,
    inLanguage: 'en',
    author: { '@type': 'Person', name: pieces.creator },
    partOf: { '@type': 'Book', name: "Shakespeare's Sonnets", datePublished: '1609' },
  })));
}
