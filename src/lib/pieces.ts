import { siteConfig, type SiteConfig } from '../config.ts';

/** Every word the feed and the piece pages use for the pieces, built from `pieces` in the config. */
export function pieceWords({ label, plural, creator }: SiteConfig['pieces'] = siteConfig.pieces) {
  const Plural = plural.charAt(0).toUpperCase() + plural.slice(1);
  return {
    /** "Sonnet 18" */
    piece: (n: number) => `${label} ${n}`,
    /** "Sonnet 18’s" */
    pieceOwner: (n: number) => `${label} ${n}’s`,
    /** "sonnets 21–40" */
    range: (first: number, last: number) => `${plural} ${first}–${last}`,
    more: `More ${plural}`,
    previousGroup: `Previous ${plural}`,
    nextGroup: `Next ${plural}`,
    pageDescription: (first: number, last: number, total: number) =>
      `${Plural} ${first} to ${last} of ${creator}'s ${total}, one per screen.`,
  };
}
