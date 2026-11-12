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

test('the sitemap lists only the home page, without unused namespaces', () => {
  const xml = read('sitemap-0.xml');
  assert.deepEqual([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]), [`${origin}/`]);
  assert.doesNotMatch(xml, /xmlns:(news|image|video|xhtml)/);
});

test('only the home page is indexable; piece and later feed pages are noindex, follow', () => {
  assert.doesNotMatch(read('index.html'), /<meta name="robots"/);
  for (const path of ['page/2/index.html', 'page/8/index.html', 'sonnets/1/index.html', 'sonnets/154/index.html']) {
    const html = read(path);
    assert.match(html, /<meta name="robots" content="noindex, follow">/, path);
    assert.match(html, /<link rel="canonical" href=/, path);
  }
});

test('indexable pages carry Open Graph tags and a 1200x630 share image', async () => {
  const html = read('index.html');
  const hash = createHash('sha256').update('/').digest('hex');
  assert.match(html, new RegExp(`<meta property="og:image" content="${esc(origin)}/_social/${hash}\\.png">`));
  assert.match(html, new RegExp(`<meta property="og:site_name" content="${esc(SITE_NAME)}">`));
  assert.match(html, /<meta property="og:image" content="[^"]+"><meta name="twitter:card" content="summary_large_image">/);
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

import { readdirSync } from 'node:fs';

const scriptsOtherThanJsonLd = (html: string) => [...html.matchAll(/<script\b[^>]*>/g)].filter((m) => !/type="application\/ld\+json"/.test(m[0]));
const allHtml = (dir: URL): URL[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? allHtml(new URL(`${e.name}/`, dir)) : e.name.endsWith('.html') ? [new URL(e.name, dir)] : []);

test('8 feed pages and 154 sonnet pages are built', () => {
  for (let p = 2; p <= 8; p++) assert.ok(existsSync(new URL(`page/${p}/index.html`, dist)), `page ${p}`);
  assert.ok(!existsSync(new URL('page/9/index.html', dist)));
  assert.ok(!existsSync(new URL('page/1/index.html', dist)));
  for (const n of [1, 18, 99, 126, 154]) assert.ok(existsSync(new URL(`sonnets/${n}/index.html`, dist)), `sonnet ${n}`);
  assert.ok(!existsSync(new URL('sonnets/155/index.html', dist)));
});

test('feed page 1: intro card, sonnets 1-20 with ids, a next card, no previous card', () => {
  const html = read('index.html');
  const ids = [...html.matchAll(/<section class="card sonnet" id="(\d+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(ids, Array.from({ length: 20 }, (_, i) => i + 1));
  assert.match(html, /class="card intro"/);
  assert.match(html, /<a href="\/page\/2\/"[^>]*>Next: sonnets 21–40/);
  assert.doesNotMatch(html, /class="card previous"/);
});

test('feed page 8: sonnets 141-154, a previous card, no next card, a self canonical', () => {
  const html = read('page/8/index.html');
  const ids = [...html.matchAll(/<section class="card sonnet" id="(\d+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(ids, Array.from({ length: 14 }, (_, i) => i + 141));
  assert.match(html, /class="card previous"/);
  assert.doesNotMatch(html, /class="card next"/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${esc(origin)}/page/8/">`));
  assert.match(read('page/2/index.html'), new RegExp(`<title>Page 2: 21–40 · ${esc(SITE_NAME)}</title>`));
});

test('a sonnet page: title, first-line description, couplet indentation, neighbours and the feed link', () => {
  const html = read('sonnets/18/index.html');
  assert.match(html, new RegExp(`<title>Sonnet 18 · ${esc(SITE_NAME)}</title>`));
  assert.match(html, /<meta name="description" content="Shall I compare thee to a summer’s day\?">/);
  assert.match(html, /<span class="line indent">So long as men can breathe, or eyes can see,<\/span>/);
  assert.match(html, /<span class="line">Shall I compare thee to a summer’s day\?<\/span>/);
  assert.match(html, /href="\/sonnets\/17\/"/);
  assert.match(html, /href="\/sonnets\/19\/"/);
  assert.match(html, /href="\/#18"/);
  assert.match(read('sonnets/25/index.html'), /href="\/page\/2\/#25"/);
  assert.doesNotMatch(read('sonnets/1/index.html'), /href="\/sonnets\/0\/"/);
  assert.doesNotMatch(read('sonnets/154/index.html'), /href="\/sonnets\/155\/"/);
});

test('a sonnet page is a CreativeWork by William Shakespeare, part of the 1609 Sonnets', () => {
  const ld = JSON.parse(read('sonnets/18/index.html').match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1]!) as Record<string, unknown>;
  assert.equal(ld['@type'], 'CreativeWork');
  assert.equal(ld['name'], 'Sonnet 18');
  assert.deepEqual(ld['author'], { '@type': 'Person', name: 'William Shakespeare' });
  assert.deepEqual(ld['isPartOf'], { '@type': 'Book', name: "Shakespeare's Sonnets", datePublished: '1609' });
});

test('no page ships JavaScript', () => {
  for (const file of allHtml(dist)) assert.deepEqual(scriptsOtherThanJsonLd(readFileSync(file, 'utf8')), [], file.pathname);
});

test('the intro card takes its line and source credit from the config', () => {
  const html = read('index.html');
  assert.match(html, new RegExp(`<p>${esc(siteConfig.intro.replace(/'/g, '&#39;'))}</p>|<p>${esc(siteConfig.intro)}</p>`));
  assert.match(html, new RegExp(`<a href="${esc(siteConfig.credit.href)}"[^>]*>${esc(siteConfig.credit.text)}</a>`));
});
