// Everything a template user changes lives here (plus the icons in public/).
export const siteConfig: SiteConfig = {
  name: 'Sonnets',
  tagline: "Shakespeare's sonnets, one at a time",
  description: "All 154 of Shakespeare's sonnets in a reels-style feed: one sonnet per screen, readable without JavaScript.",
  origin: 'https://astro-reels-template.cevdet.ch',
  /** The path of feed page 1; later pages live at `<feedBase>page/<n>/`. */
  feedBase: '/',
  /** First feed card: one line under the name. */
  intro: "Shakespeare's 154 sonnets, one per screen.",
  /** Credit for the content, shown small on the first feed card. */
  credit: { text: 'Text from Project Gutenberg', href: 'https://www.gutenberg.org/ebooks/1041' },
  /**
   * Whether search engines index each piece's page and the feed pages after the first. Leave it
   * false for demo text or text published elsewhere, such as these sonnets: those pages then carry
   * `noindex, follow` and stay out of the sitemap, so only the first feed page is indexed. Set it
   * true when the pieces are your own.
   */
  indexPieces: false,
  /**
   * Who publishes the site: credited in every page's footer and named as the publisher in the home
   * page's structured data. Leave it out to show neither.
   */
  author: { name: 'Cevdet', url: 'https://cevdet.ch/' },
  /** The source code, linked from the footer. Leave it out to drop the link. */
  repository: 'https://github.com/cevdetch/astro-reels-template',
  socialImages: true,
};

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  origin: string;
  feedBase: string;
  intro: string;
  credit: { text: string; href: string };
  indexPieces: boolean;
  /** `url` is your home page; its `#person` is the publisher's identifier in the structured data. */
  author?: { name: string; url?: string };
  repository?: string;
  socialImages: boolean;
}
