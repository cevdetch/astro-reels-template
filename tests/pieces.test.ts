import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pieceWords, piecePath } from '../src/lib/pieces.ts';

test('the demo words: Sonnet, sonnets, Shakespeare', () => {
  const words = pieceWords();
  assert.equal(words.piece(18), 'Sonnet 18');
  assert.equal(words.pieceOwner(18), 'Sonnet 18’s');
  assert.equal(words.range(21, 40), 'sonnets 21–40');
  assert.equal(words.more, 'More sonnets');
  assert.equal(words.previousGroup, 'Previous sonnets');
  assert.equal(words.nextGroup, 'Next sonnets');
  assert.equal(words.pageDescription(21, 40, 154), "Sonnets 21 to 40 of William Shakespeare's 154, one per screen.");
});

test("a fork's words reach every string", () => {
  const words = pieceWords({ label: 'Poem', plural: 'poems', creator: 'A. Poet' });
  const all = [words.piece(3), words.range(1, 20), words.more, words.previousGroup, words.nextGroup, words.pageDescription(1, 20, 40)];
  assert.deepEqual(all, ['Poem 3', 'poems 1–20', 'More poems', 'Previous poems', 'Next poems', "Poems 1 to 20 of A. Poet's 40, one per screen."]);
  for (const s of all) assert.doesNotMatch(s, /sonnet|Shakespeare/i);
});

test('a piece lives at its own path', () => {
  assert.equal(piecePath(18), '/sonnets/18/');
});
