// Helpers for the tests that read the last build (dist/) and the content it was built from.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { siteConfig } from '../src/config.ts';

export const dist = new URL('../dist/', import.meta.url);
export const origin = siteConfig.origin.replace(/\/$/, '');

/** `s` as a literal inside a RegExp. */
export const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** `s` as Astro writes an expression into text: {title}. */
export const html = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

/** `s` as Astro writes an expression into an attribute value: content={description}. */
export const attr = (s: string) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

/** A built file, failing with a hint when there is no build. */
export const read = (path: string): string => {
  const file = new URL(path, dist);
  assert.ok(existsSync(file), `dist/${path} is missing; run pnpm build first`);
  return readFileSync(file, 'utf8');
};

export const built = (path: string): boolean => existsSync(new URL(path, dist));

/** Markup without tags or extra whitespace. */
export const text = (markup: string) => markup.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** The page's one JSON-LD script, as the nodes of its @graph. */
export const jsonLd = (path: string): Record<string, unknown>[] => {
  const scripts = [...read(path).matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  assert.equal(scripts.length, 1, path);
  const ld = JSON.parse(scripts[0]![1]!) as { '@context': string; '@graph': Record<string, unknown>[] };
  assert.equal(ld['@context'], 'https://schema.org', path);
  return ld['@graph'];
};

/** The inside of every card-links nav on a page. */
export const cardLinks = (markup: string) => [...markup.matchAll(/<nav class="card-links" aria-label="[^"]*">(.*?)<\/nav>/gs)].map((m) => m[1]!);

/** Every built HTML page, as a path relative to dist/ (index.html, page/2/index.html, 404.html). */
export const htmlPages = (dir: URL = dist, prefix = ''): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? htmlPages(new URL(`${e.name}/`, dir), `${prefix}${e.name}/`)
    : e.name.endsWith('.html') && !e.name.startsWith('__') ? [`${prefix}${e.name}`] : []);

/** The URL path a built page is served at: page/2/index.html is /page/2/. */
export const servedAt = (path: string) => `/${path.replace(/(^|\/)index\.html$/, '$1')}`;

export interface SourcePiece { number: number; title: string; description: string; creator?: string; body: string }

/** One front-matter value: double-quoted (JSON escapes), single-quoted ('' for ') or plain. */
const scalar = (raw: string): string => {
  const value = raw.trim();
  if (value.startsWith('"')) return JSON.parse(value) as string;
  if (value.startsWith("'")) return value.slice(1, -1).replaceAll("''", "'");
  return value;
};

/**
 * The published pieces in src/content/<pieces.name>/, in number order, read straight from the
 * Markdown so the tests do not take the build's word for them. Front matter is read one
 * `key: value` line at a time, as the README's example writes it.
 */
export function sourcePieces(): SourcePiece[] {
  const folder = new URL(`../src/content/${siteConfig.pieces.name}/`, import.meta.url);
  const files = (dir: URL): URL[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(new URL(`${e.name}/`, dir)) : e.name.endsWith('.md') ? [new URL(e.name, dir)] : []);
  return files(folder).flatMap((file) => {
    const [, front = '', body = ''] = readFileSync(file, 'utf8').match(/^---\r?\n(.*?)\r?\n---\r?\n?(.*)$/s) ?? [];
    const data = Object.fromEntries(front.split(/\r?\n/).flatMap((line) => {
      const m = line.match(/^(\w+):(.*)$/);
      return m ? [[m[1]!, scalar(m[2]!)]] : [];
    }));
    if (data['draft'] === 'true') return [];
    return [{
      number: Number(data['number']), title: data['title']!, description: data['description']!, body,
      ...(data['creator'] ? { creator: data['creator'] } : {}),
    }];
  }).sort((a, b) => a.number - b.number);
}
