// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { siteConfig } from './src/config.ts';
import { socialImages } from './src/integrations/social-images.ts';

export default defineConfig({
  site: siteConfig.origin,
  // Every URL ends in '/': build.format 'directory' writes x/index.html, which static hosts serve at /x/.
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    socialImages(),
    sitemap({
      filter: (page) => !/\/404\/?$/.test(page),
      namespaces: { news: false, xhtml: false, image: false, video: false },
    }),
  ],
});
