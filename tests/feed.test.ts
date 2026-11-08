import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAGE_SIZE, feedHref, pageCount, pageHref, pageOf, pageRange } from '../src/lib/feed.ts';

test('154 sonnets make 8 pages of 20', () => {
  assert.equal(PAGE_SIZE, 20);
  assert.equal(pageCount(154), 8);
  assert.deepEqual(pageRange(1, 154), { first: 1, last: 20 });
  assert.deepEqual(pageRange(8, 154), { first: 141, last: 154 });
});

test('pages and deep links', () => {
  assert.equal(pageOf(1), 1);
  assert.equal(pageOf(20), 1);
  assert.equal(pageOf(21), 2);
  assert.equal(pageHref(1), '/');
  assert.equal(pageHref(2), '/page/2/');
  assert.equal(feedHref(18), '/#18');
  assert.equal(feedHref(25), '/page/2/#25');
});
