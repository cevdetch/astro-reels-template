import { siteConfig } from '../config.ts';

export const SITE_NAME = siteConfig.name;
export const TAGLINE = siteConfig.tagline;
/** Between a page title and the site name. Google rewrites hyphens least often. */
export const SEPARATOR = ' - ';
export const HOME_TITLE = `${SITE_NAME}${SEPARATOR}${TAGLINE}`;
export const MAX_DESCRIPTION = 160;

export type Direction = 'ltr' | 'rtl' | 'auto';
export interface PagePolicy { pathname: string; noindex: boolean }

export interface LayoutProps {
  /** Omit on the home page; every other page's title gets the site name appended. */
  title?: string;
  description: string;
  noindex?: boolean;
  /** Serialized JSON-LD for this page, rendered as-is. */
  jsonLd?: string;
  /** Open Graph type; essays are articles. */
  ogType?: 'website' | 'article';
  publishedTime?: Date;
  modifiedTime?: Date;
  /** Class on <body>, e.g. "feed" for scroll-snap pages. */
  bodyClass?: string;
}

export interface SeoContext {
  site: URL | undefined;
  pathname: string;
  mode: 'dev' | 'build' | 'server';
  socialImages: boolean;
}

export interface ResolvedSeo {
  title: string;
  ogTitle: string;
  description: string;
  canonicalUrl?: string;
  noindex: boolean;
  social?: { url: string; imageUrl: string };
  generatedImageUrl?: string;
}

export function validateSiteOrigin(site: string | undefined, required: boolean): URL | undefined {
  if (site === undefined && !required) return undefined;
  const message = 'Set site in astro.config.mjs to an absolute HTTP(S) origin, '
    + 'with no credentials, path, query or fragment. Use base for a subpath.';
  if (site === undefined || !/^https?:\/\/[^/?#\\\s]+\/?$/i.test(site)) {
    throw new Error(message);
  }
  let url: URL;
  try {
    url = new URL(site);
  } catch {
    throw new Error(message);
  }
  if (url.username || url.password || url.pathname !== '/') throw new Error(message);
  return url;
}

function projectRoot(origin: URL, base: string): URL {
  const root = new URL(origin.origin);
  root.pathname = base.endsWith('/') ? base : `${base}/`;
  return root;
}

export async function getGeneratedImageUrl(pathname: string, origin: URL, base: string): Promise<string> {
  const bytes = new TextEncoder().encode(pathname);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return new URL(`_social/${hash}.png`, projectRoot(origin, base)).href;
}

function text(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} must be a non-blank string.`);
  return value.trim();
}

export async function resolveSeo(props: LayoutProps, ctx: SeoContext): Promise<ResolvedSeo> {
  if (!ctx.site) throw new Error('Set site in astro.config.mjs.');
  const pageTitle = props.title === undefined ? undefined : text(props.title, 'title');
  const title = pageTitle === undefined ? HOME_TITLE : `${pageTitle}${SEPARATOR}${SITE_NAME}`;
  const description = text(props.description, 'description');
  if (description.length > MAX_DESCRIPTION) {
    throw new Error(`description must be at most ${MAX_DESCRIPTION} characters (got ${description.length}).`);
  }
  const noindex = props.noindex === true;
  const seo: ResolvedSeo = { title, ogTitle: pageTitle ?? SITE_NAME, description, noindex };
  if (noindex) return seo;
  if (!ctx.pathname.endsWith('/')) throw new Error(`canonical path must end with a trailing slash (got ${ctx.pathname}).`);
  const canonicalUrl = new URL(ctx.pathname, ctx.site).href;
  seo.canonicalUrl = canonicalUrl;
  if (ctx.mode === 'build' && ctx.socialImages) {
    const imageUrl = await getGeneratedImageUrl(ctx.pathname, ctx.site, '/');
    seo.generatedImageUrl = imageUrl;
    seo.social = { url: canonicalUrl, imageUrl };
  }
  return seo;
}
