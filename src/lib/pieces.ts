import { siteConfig, type SiteConfig } from '../config.ts';

type Words = Pick<SiteConfig['pieces'], 'label' | 'plural' | 'creator'>;

/** Every word the feed and the piece pages use for the pieces, built from `pieces` in the config. */
export function pieceWords({ label, plural, creator }: Words = siteConfig.pieces) {
  const Plural = plural.charAt(0).toUpperCase() + plural.slice(1);
  return {
    /** The label and number, e.g. "Poem 18". */
    piece: (n: number) => `${label} ${n}`,
    /** e.g. "Poem 18’s" */
    pieceOwner: (n: number) => `${label} ${n}’s`,
    /** e.g. "poems 21–40" */
    range: (first: number, last: number) => `${plural} ${first}–${last}`,
    more: `More ${plural}`,
    previousGroup: `Previous ${plural}`,
    nextGroup: `Next ${plural}`,
    pageDescription: (first: number, last: number, total: number) =>
      `${Plural} ${first} to ${last} of ${creator}'s ${total}, one per screen.`,
  };
}

/** A piece's own page. */
export const piecePath = (n: number): string => `/sonnets/${n}/`;
