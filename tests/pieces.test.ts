import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siteConfig } from '../src/config.ts';
import { orderPieces, pieceNameProblem, pieceWords, piecePath } from '../src/lib/pieces.ts';

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

test('a piece lives under the configured name', () => {
  assert.equal(piecePath(18), `/${siteConfig.pieces.name}/18/`);
  assert.equal(piecePath(3, { name: 'poems' }), '/poems/3/');
});

test('the name is a folder and a URL segment: lowercase, digits, hyphens, and not "page"', () => {
  for (const name of ['sonnets', 'poems', 'short-stories', 'haiku2']) assert.equal(pieceNameProblem(name), undefined, name);
  for (const name of ['', 'Poems', '_x', '1poems', 'poems/x', 'poems x', '.well-known']) assert.match(pieceNameProblem(name) ?? '', /pieces\.name/, name);
  assert.match(pieceNameProblem('page') ?? '', /\/page\/2\//);
});

const entry = (number: number, body = 'A line') => ({ data: { number }, body });

test('pieces come out in number order', () => {
  assert.deepEqual(orderPieces([entry(3), entry(1), entry(2)]).map((p) => p.data.number), [1, 2, 3]);
});

test('no published pieces names the folder, the setting and drafts', () => {
  assert.throws(() => orderPieces([], { name: 'poems', label: 'Poem' }),
    { message: 'No published pieces in src/content/poems/. Set pieces.name in src/config.ts to the name of your content folder, and check that not every piece is a draft.' });
});

test('the name cannot be where the feed lives', () => {
  assert.match(pieceNameProblem('reels', '/reels/') ?? '', /feedBase/);
  assert.equal(pieceNameProblem('poems', '/reels/'), undefined);
  assert.equal(pieceNameProblem('poems', '/'), undefined);
  assert.equal(pieceNameProblem('poems', '/poems-feed/'), undefined);
});

test('name errors end without a full stop, because Astro adds its own', () => {
  for (const name of ['Poems', 'page']) assert.doesNotMatch(pieceNameProblem(name) ?? 'missing', /\.$/, name);
});

test('a duplicate number or an empty body fails, naming the piece', () => {
  assert.throws(() => orderPieces([entry(1), entry(1)], { name: 'poems', label: 'Poem' }), /Poem 1 appears twice/);
  assert.throws(() => orderPieces([entry(1, '  ')], { name: 'poems', label: 'Poem' }), /Poem 1 has an empty body/);
});
