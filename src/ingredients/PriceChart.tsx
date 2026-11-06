/** Plots the values as given (oldest to newest). Only drawing math happens here, no business rule. */
export function PriceChart({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null;

  const width = 300;
  const height = 80;
  const pad = 8;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const points = values.map((value, index) => {
    const x = pad + (index / (values.length - 1)) * (width - 2 * pad);
    const y = height - pad - ((value - min) / span) * (height - 2 * pad);
    return [x, y] as const;
  });
  const last = points.at(-1);
  if (!last) return null;
  const [lastX, lastY] = last;

  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${width} ${height}`} className="h-20 w-full text-primary">
      <polyline
        points={points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r="4" fill="currentColor" />
    </svg>
  );
}