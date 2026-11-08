// Everything a template user changes lives here (plus the icons in public/).
export const siteConfig = {
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
  socialImages: true,
} as const;
