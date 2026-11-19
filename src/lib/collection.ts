import { getCollection, type CollectionEntry } from 'astro:content';
import { pieceWords } from './pieces.ts';

export type Piece = CollectionEntry<'sonnets'>;

/** Published pieces in order. Fails on duplicate numbers or empty bodies. */
export async function getPieces(): Promise<Piece[]> {
  const words = pieceWords();
  const pieces = (await getCollection('sonnets', (entry) => !entry.data.draft))
    .sort((a, b) => a.data.number - b.data.number);
  pieces.forEach((piece, i) => {
    if (!piece.body?.trim()) throw new Error(`${words.piece(piece.data.number)} has an empty body.`);
    if (i > 0 && pieces[i - 1]!.data.number === piece.data.number) throw new Error(`${words.piece(piece.data.number)} appears twice.`);
  });
  return pieces;
}
