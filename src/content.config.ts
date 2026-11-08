import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { MAX_DESCRIPTION } from './lib/seo.ts';

const sonnets = defineCollection({
  loader: glob({ base: './src/content/sonnets', pattern: '**/*.md' }),
  schema: z.object({
    number: z.number().int().positive(),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).max(MAX_DESCRIPTION),
    draft: z.boolean().default(false),
  }).strict(),
});

export const collections = { sonnets };
