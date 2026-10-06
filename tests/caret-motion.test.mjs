import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CARET_GLIDE_MS,
  caretAt,
  caretKeyframes,
} from '../lib/caret-motion.ts';

const glyph = 17;
const at = (x, y = 0) => ({ x, y });

await test('a glide starts at its origin, ends on its target and never overshoots', () => {
  const from = at(0),
    to = at(glyph);
  assert.deepEqual(caretAt(from, to, 0), from);
  assert.deepEqual(caretAt(from, to, 1), to);
  assert.deepEqual(caretAt(from, to, 5), to);
  assert.deepEqual(caretAt(from, to, -1), from);
  let previous = 0;
  for (let ms = 0; ms <= CARET_GLIDE_MS; ms++) {
    const { x } = caretAt(from, to, ms / CARET_GLIDE_MS);
    assert.ok(x >= previous && x <= glyph);
    previous = x;
  }
});

await test('fast typing retargets from the drawn position, never from an older one', () => {
  // A keystroke every 30 ms, faster than one glide: each new glide must start
  // exactly where the previous one was interrupted (the Firefox snap-back bug).
  const drawn = [];
  let from = at(0),
    to = at(glyph);
  for (let key = 2; key <= 20; key++) {
    const interrupted = caretAt(from, to, 30 / CARET_GLIDE_MS);
    drawn.push(interrupted.x);
    from = interrupted;
    to = at(key * glyph);
    assert.deepEqual(caretKeyframes(from, to)[0], interrupted);
  }
  for (let i = 1; i < drawn.length; i++) assert.ok(drawn[i] > drawn[i - 1]);
});

await test('backspace mid-glide reverses smoothly from the drawn position', () => {
  const mid = caretAt(at(0), at(5 * glyph), 0.5);
  const back = caretKeyframes(mid, at(glyph));
  assert.deepEqual(back[0], mid);
  assert.deepEqual(back.at(-1), at(glyph));
  for (let i = 1; i < back.length; i++) assert.ok(back[i].x <= back[i - 1].x);
});
