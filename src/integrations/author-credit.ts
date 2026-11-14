import type { AstroIntegration } from 'astro';
import { creditsOwnerElsewhere, type PersonRef } from '../lib/structured-data.ts';

/** The warning for a site outside cevdet.ch that still credits the template's author, else undefined. */
export function authorCreditWarning(site: string | URL, author: PersonRef | undefined): string | undefined {
  if (!author || !creditsOwnerElsewhere(site, author)) return undefined;
  return `${new URL(site).host} still credits ${author.name} (${author.url}) as its author, in the footer and `
    + 'the structured data. Set author in src/config.ts to yourself, or remove it.';
}

/** Warns once per build, without failing it, when a fork still credits the template's author. */
export function authorCredit(author: PersonRef | undefined): AstroIntegration {
  let site: string | undefined;
  return {
    name: 'author-credit',
    hooks: {
      'astro:config:done': ({ config }) => { site = config.site; },
      'astro:build:start': ({ logger }) => {
        const warning = site === undefined ? undefined : authorCreditWarning(site, author);
        if (warning) logger.warn(warning);
      },
    },
  };
}
