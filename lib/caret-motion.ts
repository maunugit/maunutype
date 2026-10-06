// --- Caret glide ---
// Every glide starts from where the caret is currently drawn, passed
// explicitly. Retargeted CSS transitions are not used: Firefox restarts them
// from a stale position, which made the caret snap back on fast typing.
export type Point = { x: number; y: number };
export const CARET_GLIDE_MS = 90;
const STEPS = 8;

const easeOut = (progress: number) => 1 - (1 - progress) ** 3;

export function caretAt(from: Point, to: Point, progress: number): Point {
  const p = easeOut(Math.min(1, Math.max(0, progress)));
  return { x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p };
}

// Linear keyframes sampled from the same curve, so the browser's animation
// and caretAt() agree on where the caret is mid-glide.
export function caretKeyframes(from: Point, to: Point): Point[] {
  return Array.from({ length: STEPS + 1 }, (_, i) =>
    caretAt(from, to, i / STEPS),
  );
}
