// Everything a template user changes lives here, plus the icons in public/ and the welcome cards in
// src/components/Intro.astro.
export const siteConfig: SiteConfig = {
  name: 'Astro Reels Template',
  tagline: 'a vertical feed with zero JavaScript',
  description: "A zero-JavaScript, reels-style vertical feed template for Astro: one piece per screen and a page for each, demoed with Shakespeare's 154 sonnets.",
  origin: 'https://astro-reels-template.cevdet.ch',
  /** The path of feed page 1; later pages live at `<feedBase>page/<n>/`. */
  feedBase: '/',
  /** First feed card: one line under the name. */
  intro: 'A reels-style vertical feed for Astro: one piece per screen, a page of its own for every piece, and not a line of JavaScript.',
  /** Credit for the content, shown on the welcome cards. */
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
