import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siteConfig } from '../src/config.ts';
import { authorCreditWarning } from '../src/integrations/author-credit.ts';
import { homeJsonLd, sonnetJsonLd } from '../src/lib/identity.ts';
import { SITE_NAME } from '../src/lib/seo.ts';

const nodes = (json: string): Record<string, unknown>[] => {
  const ld = JSON.parse(json) as { '@context': string; '@graph': Record<string, unknown>[] };
  assert.equal(ld['@context'], 'https://schema.org');
  return ld['@graph'];
};

test('the home page is one WebSite published by the configured author', () => {
  const { author } = siteConfig;
  assert.ok(author);
  assert.deepEqual(nodes(homeJsonLd(new URL('https://example.test'))), [{
    '@type': 'WebSite', '@id': 'https://example.test/#website', url: 'https://example.test/', name: SITE_NAME, inLanguage: 'en',
    publisher: { '@type': 'Person', '@id': new URL('#person', author.url).href, name: author.name, url: author.url },
  }]);
});

test('an author with a fixed id keeps it', () => {
  const [site] = nodes(homeJsonLd(new URL('https://example.test'), { author: { id: 'https://a.test/me#i', name: 'A. Writer', url: 'https://a.test/' } }));
  assert.deepEqual(site?.['publisher'], { '@type': 'Person', '@id': 'https://a.test/me#i', name: 'A. Writer', url: 'https://a.test/' });
});

test('with no author, the WebSite names no publisher', () => {
  const [site] = nodes(homeJsonLd(new URL('https://example.test'), {}));
  assert.ok(site);
  assert.equal('publisher' in site, false);
});

test('a sonnet is a CreativeWork by Shakespeare, part of the 1609 book', () => {
  const url = 'https://example.test/sonnets/18/';
  assert.deepEqual(nodes(sonnetJsonLd({ url, name: 'Sonnet 18', description: 'Shall I compare thee to a summer’s day?' })), [{
    '@type': 'CreativeWork', '@id': `${url}#work`, url, name: 'Sonnet 18', description: 'Shall I compare thee to a summer’s day?',
    inLanguage: 'en', author: { '@type': 'Person', name: 'William Shakespeare' },
    isPartOf: { '@type': 'Book', name: "Shakespeare's Sonnets", datePublished: '1609' },
  }]);
});

test('a "<" in the data cannot close the script element', () => {
  const json = sonnetJsonLd({ url: 'https://example.test/sonnets/1/', name: '</script>', description: 'a < b' });
  assert.doesNotMatch(json, /</);
  assert.equal(nodes(json)[0]?.['name'], '</script>');
});

test('a fork outside cevdet.ch that still credits cevdet.ch gets a warning', () => {
  const { author } = siteConfig;
  assert.equal(authorCreditWarning('https://astro-reels-template.cevdet.ch', author), undefined);
  assert.equal(authorCreditWarning('https://cevdet.ch', author), undefined);
  assert.match(authorCreditWarning('https://poems.example', author) ?? '', /^poems\.example still credits .+ \(https:\/\/cevdet\.ch\/\)/);
  assert.equal(authorCreditWarning('https://poems.example', { name: 'A. Writer', url: 'https://poems.example/' }), undefined);
  assert.equal(authorCreditWarning('https://poems.example', undefined), undefined);
});
