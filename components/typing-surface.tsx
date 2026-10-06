import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  CARET_GLIDE_MS,
  caretAt,
  caretKeyframes,
  type Point,
} from '../lib/caret-motion';
import type { Session } from '@/lib/typing';

type CaretMotion = {
  from: Point;
  to: Point;
  line: number;
  glide: Animation | null;
};
const translate = ({ x, y }: Point) => `translate(${x}px, ${y}px)`;

export const TypingWord = memo(function TypingWord({
  word,
  input = '',
  active,
  committed,
  last,
}: {
  word: string;
  input?: string;
  active: boolean;
  committed: boolean;
  last: boolean;
}) {
  const chars = Array.from(word + input.slice(word.length));
  const atEnd = input.length >= chars.length;
  return (
    <span className="typing-word">
      {chars.map((char, i) => (
        <span
          key={i}
          data-caret={
            active && i === (atEnd ? chars.length - 1 : input.length)
              ? 'true'
              : undefined
          }
          data-caret-edge={active && atEnd ? 'after' : undefined}
          className={
            i < input.length
              ? input[i] === word[i]
                ? 'correct-char'
                : 'incorrect-char'
              : committed
                ? 'skipped-char'
                : undefined
          }
        >
          {char}
        </span>
      ))}
      {!last && (
        <span className={committed ? 'correct-char' : undefined}> </span>
      )}
    </span>
  );
});

export function TypingSurface({
  session,
  focused,
  running,
  inputRef,
  onText,
  onErase,
  onFocusChange,
  onEscape,
  onRestart,
}: {
  session: Session;
  focused: boolean;
  running: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onText: (text: string) => void;
  onErase: (word?: boolean) => void;
  onFocusChange: (focused: boolean) => void;
  onEscape: () => void;
  onRestart: () => void;
}) {
  const content = useRef<HTMLDivElement>(null);
  const caret = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const [buffer, setBuffer] = useState('');
  const [offset, setOffset] = useState(0);
  const motion = useRef<CaretMotion>({
    from: { x: 0, y: 0 },
    to: { x: 0, y: 0 },
    line: -1,
    glide: null,
  });
  const runningRef = useRef(running);
  useLayoutEffect(() => {
    runningRef.current = running;
  }, [running]);
  const update = useCallback(() => {
    const text = content.current;
    const bar = caret.current;
    const active = text?.querySelector<HTMLElement>('[data-caret="true"]');
    if (!text || !bar || !active) return;
    const base = text.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    const word = active.closest('.typing-word')!.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
    const line = Math.round((word.top - base.top) / lineHeight);
    const target = {
      x:
        (active.dataset.caretEdge === 'after' ? rect.right : rect.left) -
        base.left,
      y: word.top - base.top,
    };
    setOffset(Math.max(0, line - 1) * lineHeight);

    const state = motion.current;
    if (
      state.line === line &&
      target.x === state.to.x &&
      target.y === state.to.y
    )
      return;
    // Start from where the caret is drawn right now, read from the running
    // glide's own clock rather than from the browser's computed style.
    const glide = state.glide;
    const from =
      glide && glide.playState === 'running'
        ? caretAt(
            state.from,
            state.to,
            Number(glide.currentTime ?? 0) / CARET_GLIDE_MS,
          )
        : state.to;
    glide?.cancel();
    state.glide = null;
    const snap =
      state.line !== line ||
      !runningRef.current ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    state.line = line;
    state.from = from;
    state.to = target;
    bar.style.transform = translate(target);
    if (snap || typeof bar.animate !== 'function') return;
    state.glide = bar.animate(
      caretKeyframes(from, target).map((point) => ({
        transform: translate(point),
      })),
      { duration: CARET_GLIDE_MS },
    );
  }, []);
  useLayoutEffect(() => {
    update();
  }, [update, session.words, session.inputs, session.wordIndex, running]);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => {
      // Reflow (resize, font load) moves glyphs: jump, don't glide.
      motion.current.line = -1;
      update();
    });
    if (content.current) observer.observe(content.current);
    const state = motion.current;
    return () => {
      observer.disconnect();
      state.glide?.cancel();
      state.glide = null;
    };
  }, [update]);
  return (
    <div
      className={`typing-window ${focused ? 'is-focused' : 'is-unfocused'} ${running ? 'is-running' : ''}`}
    >
      <div
        ref={content}
        className="typing-content"
        style={{ transform: `translateY(-${offset}px)` }}
        aria-hidden="true"
      >
        {session.words.map((word, i) => (
          <TypingWord
            key={i}
            word={word}
            input={session.inputs[i]}
            active={i === session.wordIndex}
            committed={i < session.wordIndex}
            last={i === session.words.length - 1}
          />
        ))}
        <div ref={caret} className="typing-caret" />
      </div>
      <textarea
        ref={inputRef}
        className="typing-input"
        aria-label="Typing input"
        aria-describedby="typing-instructions"
        value={buffer}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        onPaste={(event) => event.preventDefault()}
        onDrop={(event) => event.preventDefault()}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={(event) => {
          composing.current = false;
          const value = event.currentTarget.value;
          if (value) onText(value.normalize('NFC'));
          setBuffer('');
        }}
        onChange={(event) => {
          if (
            composing.current ||
            (event.nativeEvent as InputEvent).isComposing
          ) {
            setBuffer(event.target.value);
            return;
          }
          const value = event.target.value;
          if (value) onText(value.normalize('NFC'));
          setBuffer('');
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onEscape();
          }
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey
          ) {
            event.preventDefault();
            if (
              !event.repeat &&
              !composing.current &&
              !event.nativeEvent.isComposing
            ) {
              composing.current = false;
              setBuffer('');
              onRestart();
            }
          }
          if (event.key === 'Backspace' && !composing.current) {
            event.preventDefault();
            onErase(event.altKey || event.ctrlKey || event.metaKey);
          }
          if (event.key === 'Enter') event.preventDefault();
        }}
      />
      {!focused && (
        <button
          className="focus-overlay"
          onClick={() => inputRef.current?.focus({ preventScroll: true })}
        >
          click here to focus
        </button>
      )}
      <p className="sr-only">
        Type this text:{' '}
        {session.words
          .slice(session.wordIndex, session.wordIndex + 20)
          .join(' ')}
      </p>
    </div>
  );
}
