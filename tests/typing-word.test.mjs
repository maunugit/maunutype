import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const cacheDir = await mkdtemp(join(tmpdir(), 'maunutype-component-test-'));
const server = await createServer({
  cacheDir,
  optimizeDeps: { noDiscovery: true, include: [] },
  configFile: false,
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
});
after(async () => {
  await server.close();
  await rm(cacheDir, { recursive: true, force: true });
});
const { TypingWord } = await server.ssrLoadModule(
  '/components/typing-surface.tsx',
);
const render = (word, input, active = true) =>
  renderToStaticMarkup(
    createElement(TypingWord, {
      word,
      input,
      active,
      committed: false,
      last: false,
    }),
  );
const anchor = (html) => [
  ...html.matchAll(/<span([^>]*data-caret="true"[^>]*)>([^<]*)<\/span>/g),
];

await test('word-end caret anchors to a real glyph rather than an empty baseline box', () => {
  for (const [word, input, glyph] of [
    ['is', 'is', 's'],
    ['yö', 'yö', 'ö'],
    ['is', 'isx', 'x'],
  ]) {
    const html = render(word, input);
    const matches = anchor(html);
    assert.equal(matches.length, 1);
    assert.equal(matches[0][2], glyph);
    assert.match(matches[0][1], /data-caret-edge="after"/);
    assert.doesNotMatch(html, /word-end/);
  }
});

await test('backspace moves the caret back before the following glyph', () => {
  const matches = anchor(render('wonderful', 'won'));
  assert.equal(matches.length, 1);
  assert.equal(matches[0][2], 'd');
  assert.doesNotMatch(matches[0][1], /data-caret-edge="after"/);
});

await test('space transfers the single caret anchor from the finished word to the next word', () => {
  assert.equal(anchor(render('is', 'is', false)).length, 0);
  const next = anchor(render('wonderful', ''));
  assert.equal(next.length, 1);
  assert.equal(next[0][2], 'w');
  assert.doesNotMatch(next[0][1], /data-caret-edge="after"/);
});
