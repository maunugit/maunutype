import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSession,
  enterCharacter,
  erase,
  metrics,
  tick,
  defaultSettings,
  comparisonKey,
} from '../lib/typing.ts';

const config = { ...defaultSettings, duration: 15 };
const write = (s, text, start = 1000, settings = config) =>
  [...text].reduce(
    (state, c, index) =>
      enterCharacter(state, c, start + index * 100, settings),
    s,
  );

await test('first character starts the clock and counts immediately', () => {
  const s = write(createSession('hello world'), 'h');
  assert.equal(s.startedAt, 1000);
  assert.equal(metrics(s, 2000).correct, 1);
  assert.equal(metrics(s, 2000).wpm, 12);
});
await test('partial word and committed space both count at exact deadline', () => {
  const s = write(createSession('hello world'), 'hello wo');
  const ended = tick(s, 30000, config),
    m = metrics(ended, 90000);
  assert.equal(ended.endedAt, 16000);
  assert.equal(m.correct, 8);
  assert.equal(m.elapsed, 15);
  assert.equal(m.wpm, 6.4);
});
await test('correcting a mistake preserves attempt accuracy', () => {
  let s = write(createSession('hello world'), 'hx');
  s = erase(s, 1400, config);
  s = enterCharacter(s, 'e', 1500, config);
  const m = metrics(s, 2000);
  assert.equal(m.correct, 2);
  assert.equal(m.incorrect, 0);
  assert.equal(m.errors, 1);
  assert.equal(m.removedErrors, 1);
  assert.equal(m.accuracy, (2 / 3) * 100);
});
await test('skipping remaining letters is distinct from typed errors', () => {
  const s = write(createSession('hello world'), 'he '),
    m = metrics(s, 2000);
  assert.equal(m.correct, 3);
  assert.equal(m.skipped, 3);
  assert.equal(m.incorrect, 0);
  assert.equal(m.errors, 1);
});
await test('backspacing into previous word removes its space and reopens skipped letters', () => {
  let s = write(createSession('hello world'), 'he ');
  s = erase(s, 2000, config);
  assert.equal(s.wordIndex, 0);
  assert.equal(metrics(s, 2000).correct, 2);
  assert.equal(metrics(s, 2000).skipped, 0);
  s = write(s, 'llo ', 2100);
  assert.equal(metrics(s, 3000).correct, 6);
  assert.equal(metrics(s, 3000).errors, 1);
});
await test('extra characters are errors and deleting a word counts removed errors', () => {
  let s = write(createSession('cat dog'), 'catzz');
  assert.equal(metrics(s, 2000).incorrect, 2);
  s = erase(s, 2200, config, true);
  assert.equal(s.inputs[0], '');
  assert.equal(metrics(s, 2300).correct, 0);
  assert.equal(metrics(s, 2300).removedErrors, 2);
});
await test('input and backspace at the deadline cannot change a result', () => {
  const s = write(createSession('hello world'), 'he');
  const late = enterCharacter(s, 'l', 16000, config);
  assert.equal(late.inputs[0], 'he');
  assert.equal(late.endedAt, 16000);
  assert.deepEqual(erase(late, 17000, config), late);
  assert.deepEqual(enterCharacter(late, 'x', 18000, config), late);
});
await test('quotes finish on final position and report errors without forcing correction', () => {
  const q = { ...config, mode: 'quotes' };
  const s = write(createSession('be here.'), 'be herx.', 1000, q);
  assert.equal(s.endedAt, 1700);
  assert.equal(metrics(s, 5000).errors, 1);
  assert.equal(metrics(s, 5000).correct, 7);
});
await test('empty inputs are finite and space does not start an empty test', () => {
  const s = enterCharacter(createSession('hello'), ' ', 1000, config);
  assert.equal(s.startedAt, null);
  assert.equal(metrics(s, 1000).wpm, 0);
  assert.equal(metrics(s, 1000).accuracy, 100);
});
await test('Finnish characters count as single characters', () => {
  const s = write(createSession('yö käy'), 'yö ');
  assert.equal(metrics(s, 2000).correct, 3);
  assert.equal(metrics(s, 2000).accuracy, 100);
});
await test('sampling uses elapsed time, remains bounded, and includes the final result', () => {
  let s = write(createSession('hello world'), 'hello');
  s = tick(s, 2000, config);
  s = tick(s, 2050, config);
  s = tick(s, 3500, config);
  s = tick(s, 20000, config);
  assert.equal(s.samples.length, 3);
  assert.equal(s.samples.at(-1).seconds, 15);
  assert.equal(s.samples.at(-1).wpm, metrics(s, 90000).wpm);
  assert.deepEqual(tick(s, 50000, config), s);
});
await test('comparison keys separate modes, languages, durations and repeat attempts', () => {
  assert.notEqual(
    comparisonKey(config),
    comparisonKey({ ...config, language: 'finnish' }),
  );
  assert.notEqual(
    comparisonKey(config),
    comparisonKey({ ...config, duration: 30 }),
  );
  assert.notEqual(
    comparisonKey(config),
    comparisonKey(config, undefined, true),
  );
  const q = { ...config, mode: 'quotes' };
  assert.notEqual(comparisonKey(q, 'a'), comparisonKey(q, 'b'));
  assert.notEqual(comparisonKey(q, 'a'), comparisonKey(q, 'a', true));
});
