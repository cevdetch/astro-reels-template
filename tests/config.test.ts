import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { siteConfig } from '../src/config.ts';

test('a fork may leave out author and repository, as the README says', () => {
  // pnpm check fails here if the config's type makes either one required.
  const fork: Pick<typeof siteConfig, 'author' | 'repository'> = {};
  assert.deepEqual(fork, {});
});
