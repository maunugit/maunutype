'use client';
import { memo, useLayoutEffect, useRef, useState } from 'react';
import type { Session } from '@/lib/typing';

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
  const composing = useRef(false);
  const [buffer, setBuffer] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0, offset: 0, line: 0 });
  const previousLine = useRef(0);
  const [lineChanged, setLineChanged] = useState(false);
  useLayoutEffect(() => {
    const update = () => {
      const text = content.current;
      const active = text?.querySelector<HTMLElement>('[data-caret="true"]');
      if (!text || !active) return;
      const rect = active.getBoundingClientRect(),
        base = text.getBoundingClientRect();
      const word = active.closest('.typing-word')!.getBoundingClientRect();
      const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
      const top = rect.top - base.top;
      // The word's line box stays stable at both character and word boundaries.
      const line = Math.round((word.top - base.top) / lineHeight);
      const offset = Math.max(0, line - 1) * lineHeight;
      setLineChanged(previousLine.current !== line);
      previousLine.current = line;
      const edge =
        active.dataset.caretEdge === 'after' ? rect.right : rect.left;
      setPosition({ x: edge - base.left, y: top - offset, offset, line });
    };
    update();
    const observer = new ResizeObserver(update);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, [session.words, session.inputs, session.wordIndex]);
  return (
    <div
      className={`typing-window ${focused ? 'is-focused' : 'is-unfocused'} ${running ? 'is-running' : ''}`}
    >
      <div
        ref={content}
        className="typing-content"
        style={{ transform: `translateY(-${position.offset}px)` }}
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
      </div>
      <div
        className={`typing-caret ${lineChanged ? 'line-change' : ''}`}
        aria-hidden="true"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      />
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
