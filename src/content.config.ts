import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { siteConfig } from './config.ts';
import { pieceNameProblem } from './lib/pieces.ts';
import { MAX_DESCRIPTION } from './lib/seo.ts';

const { name } = siteConfig.pieces;
const problem = pieceNameProblem(name);
if (problem) throw new Error(problem);

const pieces = defineCollection({
  loader: glob({ base: `./src/content/${name}`, pattern: '**/*.md' }),
  schema: z.object({
    number: z.number().int().positive(),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).max(MAX_DESCRIPTION),
    draft: z.boolean().default(false),
  }).strict(),
});

export const collections = { [name]: pieces };
