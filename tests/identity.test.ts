import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siteConfig } from '../src/config.ts';
import { homeJsonLd, publisher } from '../src/lib/identity.ts';

test('the publisher is a Person identified by #person on their own home page', () => {
  assert.deepEqual(publisher({ name: 'Cevdet', url: 'https://cevdet.ch/' }),
    { '@type': 'Person', '@id': 'https://cevdet.ch/#person', name: 'Cevdet', url: 'https://cevdet.ch/' });
  assert.deepEqual(publisher({ name: 'A. Writer' }), { '@type': 'Person', name: 'A. Writer' });
  assert.equal(publisher(undefined), undefined);
});

test('the WebSite names the configured author as its publisher', () => {
  const site = JSON.parse(homeJsonLd(new URL('https://example.test'))) as Record<string, unknown>;
  assert.equal(site['url'], 'https://example.test/');
  assert.deepEqual(site['publisher'], publisher(siteConfig.author));
});
