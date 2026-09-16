'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  History,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  Moon,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TypingSurface } from '@/components/typing-surface';
import { SpeedChart } from '@/components/speed-chart';
import {
  createSession,
  defaultSettings,
  enterCharacter,
  erase,
  metrics,
  tick,
  comparisonKey,
  type Session,
  type Settings,
} from '@/lib/typing';
import {
  makeWords,
  pickQuote,
  quotes,
  wordLists,
  type Quote,
} from '@/lib/content';
import {
  readLibrary,
  readSettings,
  persistLibrary,
  persistSettings,
  type Result,
  type Library,
} from '@/lib/storage';

const initialText =
  'still there could world open thought little home follow around place when through another become just between light point always something both turn different way under after where time begin';
const timeLabel = (seconds: number) =>
  `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)}s`;

export default function Home() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const settingsRef = useRef(settings);
  const [session, setSession] = useState(() => createSession(initialText));
  const sessionRef = useRef(session);
  const [quote, setQuote] = useState<Quote | null>(null);
  const quoteRef = useRef<Quote | null>(null);
  const repeatedRef = useRef(false);
  const [repeated, setRepeated] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [library, setLibrary] = useState<Library>({ history: [], bests: {} });
  const libraryRef = useRef(library);
  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState(true);
  const [clock, setClock] = useState(0);
  const [panel, setPanel] = useState<'history' | 'settings' | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const restartRef = useRef<HTMLButtonElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const active =
    session.startedAt !== null && session.endedAt === null && !result;
  const currentMetrics = metrics(session, clock);

  function focusInput() {
    window.setTimeout(
      () => inputRef.current?.focus({ preventScroll: true }),
      60,
    );
  }
  function reset(
    nextSettings = settingsRef.current,
    same = false,
    source?: Result,
  ) {
    const currentQuote = source?.quoteId
      ? (quotes.find((q) => q.id === source.quoteId) ?? null)
      : quoteRef.current;
    const nextQuote =
      nextSettings.mode === 'quotes'
        ? same && currentQuote
          ? currentQuote
          : pickQuote(nextSettings.quoteLength, currentQuote?.id)
        : null;
    const text = same
      ? (source?.text ?? sessionRef.current.words.join(' '))
      : (nextQuote?.text ?? makeWords(nextSettings.language));
    const next = createSession(text);
    sessionRef.current = next;
    setSession(next);
    quoteRef.current = nextQuote;
    setQuote(nextQuote);
    repeatedRef.current =
      same ||
      Boolean(
        nextQuote &&
        Object.hasOwn(
          libraryRef.current.bests,
          comparisonKey(nextSettings, nextQuote.id, false),
        ),
      );
    setRepeated(repeatedRef.current);
    setResult(null);
    setClock(0);
    setFocused(true);
    focusInput();
  }
  function changeSettings(update: Partial<Settings>) {
    const next = { ...settingsRef.current, ...update };
    settingsRef.current = next;
    setSettings(next);
    document.documentElement.classList.toggle('dark', next.theme === 'dark');
    if (!persistSettings(next)) setStorageWarning(true);
    if (Object.keys(update).some((key) => key !== 'theme')) reset(next);
  }
  function commit(next: Session, now: number) {
    const previous = sessionRef.current;
    sessionRef.current = next;
    if (next !== previous) setSession(next);
    if (next.endedAt !== null && previous.endedAt === null) {
      const config = { ...settingsRef.current };
      const quoteId = quoteRef.current?.id;
      const key = comparisonKey(config, quoteId, repeatedRef.current);
      const saved: Result = {
        ...metrics(next, now),
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        settings: config,
        text: next.words.join(' '),
        quoteId,
        repeated: repeatedRef.current,
        key,
        samples: next.samples,
        mistakes: next.mistakes,
        bestBefore: libraryRef.current.bests[key] ?? 0,
      };
      const updated = {
        history: [saved, ...libraryRef.current.history].slice(0, 100),
        bests: {
          ...libraryRef.current.bests,
          [key]: Math.max(saved.bestBefore, saved.wpm),
        },
      };
      libraryRef.current = updated;
      setLibrary(updated);
      setResult(saved);
      if (!persistLibrary(updated)) setStorageWarning(true);
      requestAnimationFrame(() =>
        resultsRef.current?.focus({ preventScroll: true }),
      );
    }
  }
  function type(text: string) {
    const now = performance.now();
    let next = sessionRef.current;
    for (const char of text)
      next = enterCharacter(next, char, now, settingsRef.current);
    if (
      settingsRef.current.mode === 'words' &&
      next.wordIndex > next.words.length - 30
    )
      next = {
        ...next,
        words: [
          ...next.words,
          ...makeWords(settingsRef.current.language, 300).split(' '),
        ],
      };
    commit(next, now);
    setClock(now);
  }
  function remove(word = false) {
    const now = performance.now();
    commit(erase(sessionRef.current, now, settingsRef.current, word), now);
    setClock(now);
  }
  function retry(source: Result) {
    settingsRef.current = {
      ...source.settings,
      theme: settingsRef.current.theme,
    };
    setSettings(settingsRef.current);
    persistSettings(settingsRef.current);
    reset(settingsRef.current, true, source);
  }

  useEffect(() => {
    const config = readSettings(),
      saved = readLibrary();
    settingsRef.current = config;
    // oxlint-disable-next-line react/react-compiler -- Hydrate browser storage after the server render.
    setSettings(config);
    libraryRef.current = saved;
    setLibrary(saved);
    document.documentElement.classList.toggle('dark', config.theme === 'dark');
    reset(config);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => {
      if (
        sessionRef.current.startedAt === null ||
        sessionRef.current.endedAt !== null
      )
        return;
      const now = performance.now();
      commit(tick(sessionRef.current, now, settingsRef.current), now);
      setClock(now);
    }, 100);
    return () => clearInterval(timer);
  }, [ready]);
  useEffect(() => {
    if (!ready) return;
    type ToolContext = {
      registerTool: (
        tool: {
          name: string;
          description: string;
          inputSchema: object;
          annotations: { readOnlyHint: boolean };
          execute: (input: unknown) => unknown;
        },
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: ToolContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'read_typing_results',
            description:
              'Read the latest ten completed MaunuType results from this browser. Does not start or enter a typing test.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute(input) {
              if (
                !input ||
                typeof input !== 'object' ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error('Expected an empty object.');
              return libraryRef.current.history
                .slice(0, 10)
                .map(
                  ({
                    wpm,
                    accuracy,
                    elapsed,
                    createdAt,
                    settings: s,
                    repeated,
                  }) => ({
                    wpm,
                    accuracy,
                    elapsed,
                    createdAt,
                    mode: s.mode,
                    language: s.mode === 'quotes' ? 'english' : s.language,
                    repeated,
                  }),
                );
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {
      /* The typing application also works without WebMCP. */
    }
    return () => lifecycle.abort();
  }, [ready]);

  const resultQuote = result?.quoteId
    ? quotes.find((q) => q.id === result.quoteId)
    : null;
  const errorCounts =
    result?.mistakes.reduce<Record<string, number>>((counts, m) => {
      const key = m.expected === ' ' ? 'space' : m.expected;
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {}) ?? {};
  return (
    <div className={`app-shell ${active && focused ? 'in-flow' : ''}`}>
      <header className="site-header">
        <button
          className="wordmark"
          onClick={() => reset()}
          aria-label="MaunuType, new test"
        >
          maunutype
          <span className="brand-caret" />
        </button>
        <nav aria-label="Application">
          <Button
            variant="ghost"
            disabled={active}
            onClick={() => setPanel('history')}
          >
            <History /> <span className="nav-label">history</span>
          </Button>
          <Button
            variant="ghost"
            aria-label={
              settings.theme === 'light' ? 'Use dark theme' : 'Use light theme'
            }
            onClick={() =>
              changeSettings({
                theme: settings.theme === 'light' ? 'dark' : 'light',
              })
            }
          >
            {settings.theme === 'light' ? <Sun /> : <Moon />}
          </Button>
          <Button
            variant="ghost"
            aria-label="Settings and scoring"
            disabled={active}
            onClick={() => setPanel('settings')}
          >
            <SlidersHorizontal />
          </Button>
        </nav>
      </header>
      <main className={`main-stage ${result ? 'has-results' : ''}`}>
        <section
          className="test-surface"
          aria-label={result ? 'Test results' : 'Typing test'}
        >
          <div className="test-toolbar">
            <ToggleGroup
              className="mode-group"
              value={[settings.mode]}
              onValueChange={(values) => {
                if (values[0])
                  changeSettings({ mode: values[0] as Settings['mode'] });
              }}
              disabled={active}
              aria-label="Test mode"
            >
              <ToggleGroupItem value="words">words</ToggleGroupItem>
              <ToggleGroupItem value="quotes">quotes</ToggleGroupItem>
            </ToggleGroup>
            <div className="test-options">
              {settings.mode === 'words' ? (
                <>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => {
                      if (value)
                        changeSettings({
                          language: value as Settings['language'],
                        });
                    }}
                    disabled={active}
                  >
                    <SelectTrigger
                      className="language-select"
                      aria-label="Language"
                    >
                      <SelectValue>{settings.language}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">english</SelectItem>
                      <SelectItem value="finnish">finnish</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="divider" />
                  <ToggleGroup
                    value={[String(settings.duration)]}
                    disabled={active}
                    onValueChange={(values) => {
                      if (values[0])
                        changeSettings({ duration: Number(values[0]) });
                    }}
                    aria-label="Test duration"
                  >
                    {[15, 30, 60].map((duration) => (
                      <ToggleGroupItem key={duration} value={String(duration)}>
                        {duration}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <span className="muted unit-label">seconds</span>
                </>
              ) : (
                <>
                  <span className="quote-language">english</span>
                  <span className="divider" />
                  <Select
                    value={settings.quoteLength}
                    onValueChange={(value) => {
                      if (value)
                        changeSettings({
                          quoteLength: value as Settings['quoteLength'],
                        });
                    }}
                    disabled={active}
                  >
                    <SelectTrigger
                      className="language-select"
                      aria-label="Quote length"
                    >
                      <SelectValue>
                        {settings.quoteLength === 'all'
                          ? 'any length'
                          : settings.quoteLength}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">any length</SelectItem>
                      <SelectItem value="short">
                        short · under 150 characters
                      </SelectItem>
                      <SelectItem value="medium">
                        medium · 150–249 characters
                      </SelectItem>
                      <SelectItem value="long">
                        long · 250+ characters
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>
          {!result ? (
            <>
              <div className="test-meta">
                <span>
                  {active ? 'typing' : repeated ? 'repeat test' : 'ready'}
                  <span className="meta-dot">·</span>
                  {settings.mode === 'words'
                    ? `${wordLists[settings.language].length} words`
                    : `${quote?.text.length ?? 0} characters`}
                </span>
                <span
                  aria-label={
                    settings.mode === 'words'
                      ? 'Seconds remaining'
                      : 'Seconds elapsed'
                  }
                >
                  {settings.mode === 'words'
                    ? Math.max(
                        0,
                        Math.ceil(settings.duration - currentMetrics.elapsed),
                      )
                    : Math.floor(currentMetrics.elapsed)}
                  <span className="muted">s</span>
                </span>
              </div>
              <TypingSurface
                session={session}
                focused={focused}
                running={active}
                inputRef={inputRef}
                onText={type}
                onErase={remove}
                onFocusChange={setFocused}
                onEscape={() => restartRef.current?.focus()}
                onRestart={() => reset()}
              />
              <div className="test-bottom">
                <span id="typing-instructions">
                  {quote ? (
                    <>
                      {quote.author}
                      <span className="meta-dot">/</span>
                      <em>{quote.work}</em>
                    </>
                  ) : active ? (
                    focused ? (
                      ''
                    ) : (
                      'timer continues while you are away'
                    )
                  ) : (
                    'start typing to begin'
                  )}
                </span>
                <Button
                  variant="ghost"
                  ref={restartRef}
                  aria-label="New test"
                  title="New test · Enter"
                  onClick={() => reset()}
                >
                  <RotateCcw />
                </Button>
              </div>
            </>
          ) : (
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Focused results support Enter without focusing an activatable button.
            <section
              className="results-view"
              ref={resultsRef}
              tabIndex={-1}
              aria-label="Test results. Press Enter for a new test."
              onKeyDown={(event) => {
                if (
                  event.key === ' ' ||
                  (event.key === 'Enter' && event.repeat)
                ) {
                  event.preventDefault();
                } else if (
                  event.key === 'Enter' &&
                  event.target === event.currentTarget &&
                  !event.altKey &&
                  !event.ctrlKey &&
                  !event.metaKey &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  reset();
                }
              }}
              onKeyUp={(event) => {
                if (event.key === ' ') event.preventDefault();
              }}
            >
              <div className="results-eyebrow">
                <span>test complete</span>
                <span>
                  {result.settings.mode === 'words'
                    ? `${result.settings.language} / ${result.settings.duration} seconds`
                    : `quote / english / ${timeLabel(result.elapsed)}`}
                  {result.repeated ? ' / repeat' : ''}
                </span>
              </div>
              <div className="score-row" aria-live="polite">
                <div className="score-main">
                  <div className="primary-score">
                    <span className="score-number">
                      {Math.round(result.wpm)}
                    </span>
                    <span className="score-label">words per minute</span>
                  </div>
                  <div className="accuracy-score">
                    <span className="accuracy-number">
                      {result.accuracy.toFixed(1)}
                      <span>%</span>
                    </span>
                    <span className="score-label">accuracy</span>
                  </div>
                </div>
              </div>
              <SpeedChart samples={result.samples} elapsed={result.elapsed} />
              <div className="result-actions">
                <Button className="next-test" onClick={() => reset()}>
                  another {settings.mode === 'quotes' ? 'quote' : 'test'}{' '}
                  <kbd>enter</kbd> <ArrowRight />
                </Button>
                <Button variant="ghost" onClick={() => retry(result)}>
                  <RotateCcw /> retry this text
                </Button>
                <span>
                  {result.correct} correct characters
                  <span className="meta-dot">·</span>
                  {result.errors} {result.errors === 1 ? 'error' : 'errors'}
                </span>
              </div>
              {resultQuote && (
                <div className="quote-note">
                  <p>“{resultQuote.text}”</p>
                  <a href={resultQuote.source} target="_blank" rel="noreferrer">
                    {resultQuote.author} · {resultQuote.work},{' '}
                    {resultQuote.section} <ArrowUpRight size={13} />
                  </a>
                </div>
              )}
              <details className="result-details">
                <summary>result details</summary>
                <div className="detail-grid">
                  <div>
                    <strong>{result.correct}</strong>
                    <span>correct characters</span>
                  </div>
                  <div>
                    <strong>{result.incorrect}</strong>
                    <span>uncorrected characters</span>
                  </div>
                  <div>
                    <strong>{result.skipped}</strong>
                    <span>skipped characters</span>
                  </div>
                  <div>
                    <strong>{result.removedErrors}</strong>
                    <span>wrong characters removed</span>
                  </div>
                </div>
                <div className="mistyped">
                  <span>most mistyped</span>
                  {Object.entries(errorCounts).length ? (
                    Object.entries(errorCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([char, count]) => (
                        <span className="mistyped-key" key={char}>
                          {char}
                          <small>{count}</small>
                        </span>
                      ))
                  ) : (
                    <span>no mistakes</span>
                  )}
                </div>
                <p className="detail-explanation">
                  WPM counts correct characters still in the text, including
                  spaces and partial words. Accuracy remembers every
                  character-entry attempt, even when you correct a mistake. The
                  graph shows your average WPM from the start of the test.
                </p>
                {resultQuote && (
                  <p className="detail-explanation">
                    {resultQuote.translation}. {resultQuote.rights}. Typography
                    normalized for typing.
                  </p>
                )}
              </details>
            </section>
          )}
        </section>
      </main>
      {storageWarning && (
        <output className="storage-notice">
          Browser storage is unavailable. Your results and preferences will last
          for this visit only.
        </output>
      )}
      <footer className="site-footer">
        <a
          href="https://maunugit.github.io/website/"
          target="_blank"
          rel="noreferrer"
        >
          by Maunu <ArrowUpRight size={13} />
        </a>
        <span>
          <kbd>enter</kbd> restart <span className="footer-separator">/</span>{' '}
          <kbd>esc</kbd> leave typing
        </span>
      </footer>
      <Sheet
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPanel(null);
            if (!result) focusInput();
          }
        }}
      >
        <SheetContent className="utility-sheet">
          <SheetHeader>
            <SheetTitle>
              {panel === 'history' ? 'History' : 'Settings'}
            </SheetTitle>
            <SheetDescription>
              {panel === 'history'
                ? 'Your last 100 tests, saved in this browser.'
                : 'Appearance, controls, and scoring.'}
            </SheetDescription>
          </SheetHeader>
          {panel === 'history' ? (
            <div className="history-content">
              {library.history.length ? (
                <>
                  <div className="history-summary">
                    <strong>{library.history.length}</strong>
                    <span>
                      completed{' '}
                      {library.history.length === 1 ? 'test' : 'tests'}
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>test</TableHead>
                        <TableHead>WPM</TableHead>
                        <TableHead>accuracy</TableHead>
                        <TableHead>
                          <span className="sr-only">Open result</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {library.history.map((saved) => (
                        <TableRow key={saved.id}>
                          <TableCell>
                            <div className="history-type">
                              {saved.settings.mode === 'quotes'
                                ? 'quote'
                                : `${saved.settings.language} · ${saved.settings.duration}s`}
                              {saved.repeated && <small>repeat</small>}
                            </div>
                            <span className="history-date">
                              {new Date(saved.createdAt).toLocaleDateString(
                                undefined,
                                { month: 'short', day: 'numeric' },
                              )}{' '}
                              ·{' '}
                              {new Date(saved.createdAt).toLocaleTimeString(
                                undefined,
                                { hour: '2-digit', minute: '2-digit' },
                              )}
                            </span>
                          </TableCell>
                          <TableCell>{Math.round(saved.wpm)}</TableCell>
                          <TableCell>{saved.accuracy.toFixed(1)}%</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`View result: ${Math.round(saved.wpm)} WPM on ${new Date(saved.createdAt).toLocaleString()}`}
                              onClick={() => {
                                setResult(saved);
                                settingsRef.current = {
                                  ...saved.settings,
                                  theme: settingsRef.current.theme,
                                };
                                setSettings(settingsRef.current);
                                setPanel(null);
                              }}
                            >
                              <ArrowUpRight />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="empty-history">
                  <History size={28} strokeWidth={1} />
                  <h3>No completed tests</h3>
                  <p>Finish your first test and it will appear here.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPanel(null);
                      focusInput();
                    }}
                  >
                    <ArrowLeft /> back to typing
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="settings-content">
              <div className="setting-row">
                <span>appearance</span>
                <ToggleGroup
                  value={[settings.theme]}
                  onValueChange={(values) => {
                    if (values[0])
                      changeSettings({ theme: values[0] as Settings['theme'] });
                  }}
                  aria-label="Appearance"
                >
                  <ToggleGroupItem value="light">
                    <Sun size={15} /> light
                  </ToggleGroupItem>
                  <ToggleGroupItem value="dark">
                    <Moon size={15} /> dark
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <section>
                <h3>Keyboard controls</h3>
                <p>
                  Start on your first character. Space moves to the next word,
                  even if it is unfinished. Backspace lets you return to earlier
                  words.
                </p>
                <p>
                  <kbd>⌥</kbd> / <kbd>ctrl</kbd> + <kbd>backspace</kbd> removes
                  the current word. <kbd>enter</kbd> starts a new test.
                </p>
                <p>
                  The timer keeps running when you leave the typing area. Quotes
                  finish when you reach the end; errors are allowed and
                  reflected in your results.
                </p>
              </section>
              <section>
                <h3>Scoring</h3>
                <p>
                  <strong>WPM</strong> = correct characters ÷ 5 ÷ elapsed
                  minutes. Spaces and unfinished words count.
                </p>
                <p>
                  <strong>Accuracy</strong> = correct entry attempts ÷ all entry
                  attempts. Deleting an error never erases it from accuracy.
                  Skipping the rest of a word with Space counts as one incorrect
                  attempt; skipped letters are reported separately.
                </p>
                <p>
                  Personal bests match the language and duration, or the exact
                  quote. Repeated texts have separate records.
                </p>
              </section>
              <section>
                <h3>Quote collection</h3>
                <p>
                  {quotes.length} passages from Thoreau, Emerson, McCarthy,
                  Epictetus, and the Dhammapada. Source links and translation
                  credits are included in results. Apostrophes are normalized
                  for typing.
                </p>
              </section>
              <p className="local-note">
                Preferences, the last 100 tests, and personal bests stay in this
                browser. No account, no syncing.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
