# Astro Reels Template

An Astro template for a reels-style feed of short pieces: one piece per screen, deep links,
keyboard navigation and sharing, readable without JavaScript. The demo content is
Shakespeare's 154 sonnets (public domain).

Work in progress: the foundation is in place; the reels feed is being designed.

## Make it yours

Edit `src/config.ts` (name, tagline, description, production origin) and replace the icons in
`public/`.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Local dev server |
| `pnpm check` | Astro and TypeScript checks |
| `pnpm build` | Build the static site into `dist/` |
| `pnpm test` | Unit tests, and checks of the last build |
| `pnpm lint:html` | Audit `dist/` with deadhead |
| `pnpm verify` | All of the above, in order |

Built from [`cevdetch/astro-minimal-template`](https://github.com/cevdetch/astro-minimal-template)
at `a2b023d`. MIT licensed.
