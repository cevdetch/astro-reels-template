import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import sharp from 'sharp';
import { siteConfig } from '../src/config.ts';
import { pieceWords } from '../src/lib/pieces.ts';
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
  assert.match(html, /<a href="\/">Go to the home page<\/a><a href="\/#1">Start with Sonnet 1 ↓<\/a>/);
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

/** The page's one JSON-LD script, as the nodes of its @graph. */
const jsonLd = (path: string): Record<string, unknown>[] => {
  const scripts = [...read(path).matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  assert.equal(scripts.length, 1, path);
  const ld = JSON.parse(scripts[0]![1]!) as { '@context': string; '@graph': Record<string, unknown>[] };
  assert.equal(ld['@context'], 'https://schema.org', path);
  return ld['@graph'];
};

test('the home page declares the WebSite, published by the configured author', () => {
  const { author } = siteConfig;
  assert.ok(author);
  assert.deepEqual(jsonLd('index.html'), [{
    '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: SITE_NAME, inLanguage: 'en',
    publisher: { '@type': 'Person', '@id': 'https://cevdet.ch/#person', name: author.name, url: 'https://cevdet.ch/' },
  }]);
});

test('every page ends with the author and source credit from the config', () => {
  const { author, repository } = siteConfig;
  assert.ok(author && repository);
  for (const path of ['index.html', 'page/8/index.html', 'sonnets/18/index.html', '404.html']) {
    const footer = read(path).match(/<footer class="site">(.*?)<\/footer>/s)?.[1];
    assert.equal(footer, `<p>By <a href="${author.url}">${author.name}</a> · <a href="${repository}">Source code</a></p>`, path);
  }
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
  assert.match(html, /<a href="\/page\/2\/#21"[^>]*>Next: sonnets 21–40/);
  assert.doesNotMatch(html, /class="card previous"/);
});

test('feed page 8: sonnets 141-154, a previous card, no next card, a self canonical', () => {
  const html = read('page/8/index.html');
  const ids = [...html.matchAll(/<section class="card sonnet" id="(\d+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(ids, Array.from({ length: 14 }, (_, i) => i + 141));
  assert.match(html, /class="card previous"/);
  assert.doesNotMatch(html, /class="card next"/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${esc(origin)}/page/8/">`));
  assert.match(read('page/2/index.html'), new RegExp(`<title>Page 2: 21–40 - ${esc(SITE_NAME)}</title>`));
});

test('a sonnet page: title, first-line description, couplet indentation, neighbours and the feed link', () => {
  const html = read('sonnets/18/index.html');
  assert.match(html, new RegExp(`<title>Sonnet 18 - ${esc(SITE_NAME)}</title>`));
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

const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

test('a sonnet page names the piece and its creator in view', () => {
  const html = read('sonnets/18/index.html');
  const h1 = html.match(/<h1\b[^>]*>(.*?)<\/h1>/s)?.[1] ?? '';
  assert.equal(text(h1), `${siteConfig.pieces.label} 18`);
  assert.doesNotMatch(h1, /visually-hidden/);
  assert.match(html, new RegExp(`<p class="byline">${esc(siteConfig.pieces.creator)}</p>`));
});

test('a feed card names the piece and shows its place in the collection', () => {
  const html = read('index.html');
  const h2 = html.match(/<h2 class="number" id="sonnet-18">(.*?)<\/h2>/s)?.[1] ?? '';
  assert.equal(text(h2), `${siteConfig.pieces.label} 18 of 154`);
  assert.match(h2, new RegExp(`<span class="visually-hidden">${esc(siteConfig.pieces.label)} </span>18`));
  assert.doesNotMatch(html, /class="byline"/);
});

test('turning forward lands on the first piece of the next page, not on its previous-page card', () => {
  const card20 = read('index.html').match(/<section class="card sonnet" id="20".*?<\/section>/s)?.[0] ?? '';
  assert.match(card20, /<a href="\/page\/2\/#21">Next<span class="visually-hidden">: Sonnet 21<\/span> ↓<\/a>/);
  assert.match(read('page/7/index.html'), /<a href="\/page\/8\/#141" rel="next">/);
  assert.match(read('page/2/index.html'), /<a href="\/" rel="prev">← Previous: sonnets 1–20<\/a>/);
});

test("every piece and page string in the feed comes from the config's words", () => {
  const words = pieceWords();
  const page2 = read('page/2/index.html');
  assert.match(page2, new RegExp(`aria-label="${words.previousGroup}"`));
  assert.match(page2, new RegExp(`<h1 class="visually-hidden">${esc(SITE_NAME)}: ${words.range(21, 40)}</h1>`));
  assert.match(page2, new RegExp(`aria-label="${words.nextGroup}"`));
  assert.match(page2, new RegExp(`<meta name="description" content="${esc(words.pageDescription(21, 40, 154))}">`));
  const sonnet18 = read('sonnets/18/index.html');
  assert.match(sonnet18, new RegExp(`aria-label="${words.more}"`));
  assert.match(sonnet18, new RegExp(`rel="prev">← ${words.piece(17)}</a>`));
  assert.match(sonnet18, new RegExp(`rel="next">${words.piece(19)} →</a>`));
  assert.match(read('index.html'), new RegExp(`<nav class="card-links" aria-label="${words.piece(3)}">`));
});

const cardLinks = (html: string) => [...html.matchAll(/<nav class="card-links" aria-label="[^"]*">(.*?)<\/nav>/gs)].map((m) => m[1]!);

test('feed card links say where they go, with arrows, and name the piece for screen readers', () => {
  const card3 = cardLinks(read('index.html')).find((l) => l.includes('/sonnets/3/'));
  assert.equal(card3, '<a href="#4">Next<span class="visually-hidden">: Sonnet 4</span> ↓</a><a href="/sonnets/3/"><span class="visually-hidden">Sonnet 3’s </span>Own page →</a>');
});

test('no two links in the feed share a name', () => {
  const names = cardLinks(read('index.html')).flatMap((l) => [...l.matchAll(/<a\b[^>]*>(.*?)<\/a>/gs)].map((m) => text(m[1]!)));
  assert.ok(names.length >= 40);
  assert.equal(new Set(names).size, names.length);
});

test('the last piece leads back to the first instead of onward', () => {
  const last = cardLinks(read('page/8/index.html')).find((l) => l.includes('/sonnets/154/'));
  assert.ok(last);
  assert.match(last, /<a href="\/#1">Back to the first ↑<\/a>/);
  assert.doesNotMatch(last, />Next</);
});

test('a sonnet page is a CreativeWork by William Shakespeare, part of the 1609 Sonnets', () => {
  assert.deepEqual(jsonLd('sonnets/18/index.html'), [{
    '@type': 'CreativeWork', '@id': `${origin}/sonnets/18/#work`, url: `${origin}/sonnets/18/`, name: 'Sonnet 18',
    description: 'Shall I compare thee to a summer’s day?', inLanguage: 'en',
    author: { '@type': 'Person', name: 'William Shakespeare' },
    isPartOf: { '@type': 'Book', name: "Shakespeare's Sonnets", datePublished: '1609' },
  }]);
});

test('no page ships JavaScript', () => {
  for (const file of allHtml(dist)) assert.deepEqual(scriptsOtherThanJsonLd(readFileSync(file, 'utf8')), [], file.pathname);
});

test('the welcome cards take their line and source credit from the config', () => {
  const html = read('index.html');
  assert.match(html, new RegExp(`<p class="lead">${esc(siteConfig.intro.replace(/'/g, '&#39;'))}</p>|<p class="lead">${esc(siteConfig.intro)}</p>`));
  assert.match(html, new RegExp(`<a href="${esc(siteConfig.credit.href)}"[^>]*>${esc(siteConfig.credit.text)}</a>`));
});

test('the home page explains the template in its own words, before the first sonnet', () => {
  const html = read('index.html');
  const own = html.slice(html.indexOf('<main'), html.indexOf('<section class="card sonnet"'));
  const words = own.replace(/<[^>]+>/g, ' ').split(/\s+/).filter((w) => /\w/.test(w));
  assert.ok(words.length >= 250, `${words.length} words`);
  assert.match(own, /<code>pnpm create astro@latest --template cevdetch\/astro-reels-template<\/code>/);
  assert.match(own, /Shakespeare&#39;s 154 sonnets|Shakespeare's 154 sonnets/);
  assert.match(own, new RegExp(`<a href="${esc(siteConfig.repository!)}">`));
  assert.match(own, new RegExp(`<a href="${esc(siteConfig.author!.url)}">Made by ${esc(siteConfig.author!.name)}</a>`));
});
