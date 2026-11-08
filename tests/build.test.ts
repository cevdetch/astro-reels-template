import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import sharp from 'sharp';
import { siteConfig } from '../src/config.ts';
import { HOME_TITLE, SITE_NAME } from '../src/lib/seo.ts';

const dist = new URL('../dist/', import.meta.url);
const origin = siteConfig.origin.replace(/\/$/, '');
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const read = (path: string): string => {
  const file = new URL(path, dist);
  assert.ok(existsSync(file), `dist/${path} is missing; run pnpm build first`);
  return readFileSync(file, 'utf8');
};

test('the home page has the site title, a self canonical and both colour schemes', () => {
  const html = read('index.html');
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta name="color-scheme" content="dark light">/);
  assert.match(html, new RegExp(`<title>${esc(HOME_TITLE.replace(/'/g, '&#39;'))}</title>|<title>${esc(HOME_TITLE)}</title>`));
  assert.match(html, new RegExp(`<link rel="canonical" href="${esc(origin)}/">`));
});

test('the layout links the icons and the generated manifest', () => {
  const html = read('index.html');
  assert.match(html, /<link rel="icon" href="\/favicon\.ico" sizes="48x48">/);
  assert.match(html, /<link rel="icon" href="\/icon\.svg" type="image\/svg\+xml">/);
  assert.match(html, /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png">/);
  assert.match(html, /<link rel="manifest" href="\/site\.webmanifest">/);
  const manifest = JSON.parse(read('site.webmanifest')) as { name: string; icons: { src: string }[] };
  assert.equal(manifest.name, SITE_NAME);
  for (const icon of manifest.icons) assert.ok(existsSync(new URL(icon.src.slice(1), dist)), icon.src);
});

test('the 404 page is noindex, has no canonical or share image, and is not in the sitemap', () => {
  const html = read('404.html');
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(html, /rel="canonical"|og:image/);
  assert.doesNotMatch(read('sitemap-0.xml'), /404/);
});

test('robots.txt allows crawling and names the sitemap index', () => {
  assert.equal(read('robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap-index.xml\n`);
});

test('the sitemap lists the home page without unused namespaces', () => {
  const xml = read('sitemap-0.xml');
  assert.match(xml, new RegExp(`<loc>${esc(origin)}/</loc>`));
  assert.doesNotMatch(xml, /xmlns:(news|image|video|xhtml)/);
});

test('indexable pages carry Open Graph tags and a 1200x630 share image', async () => {
  const html = read('index.html');
  const hash = createHash('sha256').update('/').digest('hex');
  assert.match(html, new RegExp(`<meta property="og:image" content="${esc(origin)}/_social/${hash}\\.png">`));
  assert.match(html, new RegExp(`<meta property="og:site_name" content="${esc(SITE_NAME)}">`));
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.doesNotMatch(html, /og:image:(width|height)|data-starter-/);
  const { info } = await sharp(readFileSync(new URL(`_social/${hash}.png`, dist))).raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 1200);
  assert.equal(info.height, 630);
});

test('the home page declares the WebSite', () => {
  const script = read('index.html').match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  assert.ok(script);
  const site = JSON.parse(script[1]!) as Record<string, string>;
  assert.equal(site['@type'], 'WebSite');
  assert.equal(site['name'], SITE_NAME);
});
