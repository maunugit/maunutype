import {
  defaultSettings,
  type Settings,
  type Metrics,
  type Sample,
  type Mistake,
} from './typing';
export type Result = Metrics & {
  id: string;
  createdAt: string;
  settings: Settings;
  text: string;
  quoteId?: string;
  repeated: boolean;
  key: string;
  samples: Sample[];
  mistakes: Mistake[];
  bestBefore: number;
};
export type Library = { history: Result[]; bests: Record<string, number> };
const SETTINGS_KEY = 'maunutype:settings:v1';
const RESULTS_KEY = 'maunutype:results:v1';
export function validSettings(value: unknown): value is Settings {
  if (!value || typeof value !== 'object') return false;
  const s = value as Settings;
  return (
    ['words', 'quotes'].includes(s.mode) &&
    ['english', 'finnish'].includes(s.language) &&
    [15, 30, 60].includes(s.duration) &&
    ['all', 'short', 'medium', 'long'].includes(s.quoteLength) &&
    ['light', 'dark'].includes(s.theme)
  );
}
export function readSettings(): Settings {
  try {
    const value = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
    return validSettings(value) ? value : defaultSettings;
  } catch {
    return defaultSettings;
  }
}
export function readLibrary(): Library {
  try {
    const value = JSON.parse(localStorage.getItem(RESULTS_KEY) ?? 'null');
    if (
      !value ||
      !Array.isArray(value.history) ||
      !value.bests ||
      typeof value.bests !== 'object'
    )
      return { history: [], bests: {} };
    const history = value.history
      .filter(
        (r: Result) =>
          r &&
          typeof r.id === 'string' &&
          typeof r.text === 'string' &&
          typeof r.createdAt === 'string' &&
          Number.isFinite(Date.parse(r.createdAt)) &&
          validSettings(r.settings) &&
          typeof r.key === 'string' &&
          typeof r.repeated === 'boolean' &&
          [
            'wpm',
            'accuracy',
            'elapsed',
            'correct',
            'incorrect',
            'skipped',
            'attempts',
            'errors',
            'removedErrors',
            'bestBefore',
          ].every((k) => Number.isFinite(r[k as keyof Result])) &&
          Array.isArray(r.samples) &&
          r.samples.every(
            (s) =>
              s &&
              Number.isFinite(s.seconds) &&
              Number.isFinite(s.wpm) &&
              Number.isFinite(s.errors),
          ) &&
          Array.isArray(r.mistakes) &&
          r.mistakes.every(
            (m) =>
              m &&
              typeof m.expected === 'string' &&
              typeof m.actual === 'string' &&
              Number.isFinite(m.time),
          ),
      )
      .slice(0, 100);
    const bests = Object.fromEntries(
      Object.entries(value.bests).filter(
        ([key, n]) =>
          key.startsWith('v1:') &&
          typeof n === 'number' &&
          Number.isFinite(n) &&
          n >= 0,
      ),
    ) as Record<string, number>;
    return { history, bests };
  } catch {
    return { history: [], bests: {} };
  }
}
export function persistSettings(settings: Settings): boolean {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
export function persistLibrary(library: Library): boolean {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(library));
    return true;
  } catch {
    return false;
  }
}
