import { getCollection, type CollectionEntry } from 'astro:content';

export type Sonnet = CollectionEntry<'sonnets'>;

/** Published sonnets in book order. Fails on duplicate numbers or empty bodies. */
export async function getSonnets(): Promise<Sonnet[]> {
  const sonnets = (await getCollection('sonnets', (entry) => !entry.data.draft))
    .sort((a, b) => a.data.number - b.data.number);
  sonnets.forEach((sonnet, i) => {
    if (!sonnet.body?.trim()) throw new Error(`Sonnet ${sonnet.data.number} has an empty body.`);
    if (i > 0 && sonnets[i - 1]!.data.number === sonnet.data.number) throw new Error(`Sonnet ${sonnet.data.number} appears twice.`);
  });
  return sonnets;
}

export const sonnetPath = (n: number): string => `/sonnets/${n}/`;
