export type Mode = 'words' | 'quotes';
export type Language = 'english' | 'finnish';
export type Settings = {
  mode: Mode;
  language: Language;
  duration: number;
  quoteLength: 'all' | 'short' | 'medium' | 'long';
  theme: 'light' | 'dark';
};
export const defaultSettings: Settings = {
  mode: 'words',
  language: 'english',
  duration: 30,
  quoteLength: 'all',
  theme: 'light',
};
export type Mistake = { expected: string; actual: string; time: number };
export type Sample = { seconds: number; wpm: number; errors: number };
export type Session = {
  words: string[];
  inputs: string[];
  wordIndex: number;
  startedAt: number | null;
  endedAt: number | null;
  attempts: number;
  correctAttempts: number;
  removedErrors: number;
  mistakes: Mistake[];
  samples: Sample[];
};
export type Metrics = {
  wpm: number;
  accuracy: number;
  correct: number;
  incorrect: number;
  skipped: number;
  elapsed: number;
  attempts: number;
  errors: number;
  removedErrors: number;
};
export function createSession(text: string): Session {
  return {
    words: text.trim().split(/\s+/),
    inputs: [''],
    wordIndex: 0,
    startedAt: null,
    endedAt: null,
    attempts: 0,
    correctAttempts: 0,
    removedErrors: 0,
    mistakes: [],
    samples: [],
  };
}
export function metrics(session: Session, now: number): Metrics {
  let correct = 0,
    incorrect = 0,
    skipped = 0;
  for (let w = 0; w <= session.wordIndex; w++) {
    const input = session.inputs[w] ?? '',
      word = session.words[w] ?? '';
    for (let c = 0; c < input.length; c++) {
      if (input[c] === word[c]) correct++;
      else incorrect++;
    }
    if (w < session.wordIndex) {
      correct++;
      skipped += Math.max(0, word.length - input.length);
    }
  }
  const elapsed =
    session.startedAt === null
      ? 0
      : Math.max(0, ((session.endedAt ?? now) - session.startedAt) / 1000);
  return {
    wpm: elapsed > 0 ? correct / 5 / (elapsed / 60) : 0,
    accuracy: session.attempts
      ? (session.correctAttempts / session.attempts) * 100
      : 100,
    correct,
    incorrect,
    skipped,
    elapsed,
    attempts: session.attempts,
    errors: session.attempts - session.correctAttempts,
    removedErrors: session.removedErrors,
  };
}
export function finish(session: Session, now: number): Session {
  if (session.endedAt !== null || session.startedAt === null) return session;
  return sample({ ...session, endedAt: now }, now);
}
export function sample(session: Session, now: number): Session {
  const m = metrics(session, now);
  const last = session.samples.at(-1);
  if (last && Math.abs(last.seconds - m.elapsed) < 0.001) return session;
  return {
    ...session,
    samples: [
      ...session.samples,
      { seconds: m.elapsed, wpm: m.wpm, errors: m.errors },
    ],
  };
}
export function tick(
  session: Session,
  now: number,
  settings: Settings,
): Session {
  if (session.startedAt === null || session.endedAt !== null) return session;
  if (
    settings.mode === 'words' &&
    now >= session.startedAt + settings.duration * 1000
  )
    return finish(session, session.startedAt + settings.duration * 1000);
  if (
    Math.floor((now - session.startedAt) / 1000) >
    Math.floor(session.samples.at(-1)?.seconds ?? 0)
  )
    return sample(session, now);
  return session;
}
export function enterCharacter(
  session: Session,
  character: string,
  now: number,
  settings: Settings,
): Session {
  let next = tick(session, now, settings);
  if (
    next.endedAt !== null ||
    character.length !== 1 ||
    character === '\n' ||
    character === '\r'
  )
    return next;
  const input = next.inputs[next.wordIndex] ?? '',
    word = next.words[next.wordIndex];
  if (!word || (character === ' ' && !input)) return next;
  if (next.startedAt === null) next = { ...next, startedAt: now };
  const isSpace = character === ' ';
  const correct = isSpace
    ? input.length >= word.length
    : character === word[input.length];
  const inputs = [...next.inputs];
  next = {
    ...next,
    inputs,
    attempts: next.attempts + 1,
    correctAttempts: next.correctAttempts + Number(correct),
  };
  if (!correct)
    next.mistakes = [
      ...next.mistakes,
      {
        expected: word[input.length] ?? 'space',
        actual: character,
        time: (now - next.startedAt!) / 1000,
      },
    ];
  if (isSpace && next.wordIndex < next.words.length - 1) {
    next.wordIndex++;
    inputs[next.wordIndex] = '';
  } else if (!isSpace) inputs[next.wordIndex] = input + character;
  if (
    settings.mode === 'quotes' &&
    next.wordIndex === next.words.length - 1 &&
    (inputs[next.wordIndex]?.length ?? 0) >= next.words[next.wordIndex].length
  )
    return finish(next, now);
  return next;
}
export function erase(
  session: Session,
  now: number,
  settings: Settings,
  wholeWord = false,
): Session {
  const next = tick(session, now, settings);
  if (next.endedAt !== null) return next;
  const inputs = [...next.inputs];
  let wordIndex = next.wordIndex;
  if (!inputs[wordIndex] && wordIndex > 0) {
    inputs.pop();
    wordIndex--;
    if (!wholeWord) return { ...next, inputs, wordIndex };
  }
  const value = inputs[wordIndex] ?? '';
  const retained = wholeWord ? '' : value.slice(0, -1);
  let removed = 0;
  for (let c = retained.length; c < value.length; c++)
    if (value[c] !== next.words[wordIndex][c]) removed++;
  inputs[wordIndex] = retained;
  return {
    ...next,
    inputs,
    wordIndex,
    removedErrors: next.removedErrors + removed,
  };
}
export function comparisonKey(
  settings: Settings,
  quoteId?: string,
  repeated = false,
) {
  return settings.mode === 'quotes'
    ? `v1:quote:${quoteId}:${repeated ? 'repeat' : 'first'}`
    : `v1:words:${settings.language}:${settings.duration}:${repeated ? 'repeat' : 'fresh'}`;
}
