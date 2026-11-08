import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stanzas } from '../src/lib/verse.ts';

test('lines keep their order, em-space indentation becomes a flag, blank lines split stanzas', () => {
  const body = 'First line\nSecond line\n  Indented line\n\nNew stanza\n';
  assert.deepEqual(stanzas(body), [
    [{ text: 'First line', indent: false }, { text: 'Second line', indent: false }, { text: 'Indented line', indent: true }],
    [{ text: 'New stanza', indent: false }],
  ]);
});

test('surrounding blank lines and trailing spaces are ignored', () => {
  assert.deepEqual(stanzas('\n\nOnly line  \n\n'), [[{ text: 'Only line', indent: false }]]);
});

test('two plain spaces indent a line too, as the README promises', () => {
  assert.deepEqual(stanzas('Line\n  Indented with spaces\n'), [
    [{ text: 'Line', indent: false }, { text: 'Indented with spaces', indent: true }],
  ]);
});
