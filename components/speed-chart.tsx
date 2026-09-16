'use client';
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Inline SVG uses an image role for assistive technology. */
/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions -- Pointer movement only reveals chart values; it does not perform an action. */
import { useId, useState } from 'react';
import type { Sample } from '@/lib/typing';

export function SpeedChart({
  samples,
  elapsed,
}: {
  samples: Sample[];
  elapsed: number;
}) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const width = 900,
    height = 208,
    left = 38,
    right = 15,
    top = 40,
    bottom = 30;
  const maximum = Math.max(
    40,
    Math.ceil(Math.max(...samples.map((s) => s.wpm), 0) / 40) * 40,
  );
  const x = (seconds: number) =>
    left + (seconds / Math.max(elapsed, 0.001)) * (width - left - right);
  const y = (wpm: number) =>
    height - bottom - (wpm / maximum) * (height - top - bottom);
  const line = samples
    .map((s, index) => `${index ? 'L' : 'M'} ${x(s.seconds)} ${y(s.wpm)}`)
    .join(' ');
  const selected = hover === null ? undefined : samples[hover];
  return (
    <div className="chart-container">
      <div className="chart-heading">
        <span>typing speed</span>
        <div>
          <span className="line-key" /> WPM <span className="error-key">×</span>{' '}
          errors
        </div>
      </div>
      <svg
        className="speed-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={id}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const seconds =
            ((((event.clientX - rect.left) / rect.width) * width - left) /
              (width - left - right)) *
            elapsed;
          let nearest = 0;
          samples.forEach((s, i) => {
            if (
              Math.abs(s.seconds - seconds) <
              Math.abs(samples[nearest].seconds - seconds)
            )
              nearest = i;
          });
          setHover(nearest);
        }}
      >
        <title id={id}>
          Cumulative words per minute over {elapsed.toFixed(1)} seconds. Crosses
          show intervals containing errors.
        </title>
        {[0, 1, 2, 3].map((i) => {
          const value = (maximum * i) / 3;
          return (
            <g key={i}>
              <line
                className="grid-line"
                x1={left}
                x2={width - right}
                y1={y(value)}
                y2={y(value)}
              />
              <text x={left - 12} y={y(value) + 4} textAnchor="end">
                {Math.round(value)}
              </text>
            </g>
          );
        })}
        {[0, 1, 2, 3, 4].map((i) => (
          <text
            key={i}
            x={x((elapsed * i) / 4)}
            y={height - 6}
            textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}
          >
            {Math.round((elapsed * i) / 4)}s
          </text>
        ))}
        <path
          d={line}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {samples.length === 1 && (
          <circle
            cx={x(samples[0].seconds)}
            cy={y(samples[0].wpm)}
            r="3"
            fill="var(--foreground)"
          />
        )}
        {samples.map((s, i) =>
          s.errors > (samples[i - 1]?.errors ?? 0) ? (
            <g key={i} className="error-mark">
              <title>
                {s.seconds.toFixed(1)}s:{' '}
                {s.errors - (samples[i - 1]?.errors ?? 0)} errors since previous
                sample
              </title>
              <path
                d={`M ${x(s.seconds) - 3} ${height - bottom - 6} l 6 -6 M ${x(s.seconds) - 3} ${height - bottom - 12} l 6 6`}
              />
            </g>
          ) : null,
        )}
        {selected && (
          <g className="chart-tooltip" pointerEvents="none">
            <line
              x1={x(selected.seconds)}
              x2={x(selected.seconds)}
              y1={top}
              y2={height - bottom}
              className="hover-line"
            />
            <circle
              cx={x(selected.seconds)}
              cy={y(selected.wpm)}
              r="4"
              fill="var(--foreground)"
            />
            <rect
              x={Math.min(
                width - 163,
                Math.max(left, x(selected.seconds) - 68),
              )}
              y={4}
              width="150"
              height="25"
              rx="3"
              fill="var(--background)"
              fillOpacity="0.42"
              stroke="var(--foreground)"
              strokeOpacity="0.1"
            />
            <text
              x={Math.min(
                width - 158,
                Math.max(left + 5, x(selected.seconds) - 63),
              )}
              y={20}
              className="chart-tooltip-text"
            >
              {Math.round(selected.wpm)} wpm · {selected.seconds.toFixed(1)}s
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
