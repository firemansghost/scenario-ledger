interface MiniSparklineProps {
  values: (number | null)[];
  height?: number;
  width?: number;
  strokeClassName?: string;
}

export function MiniSparkline({
  values,
  height = 20,
  width = 80,
  strokeClassName = "stroke-zinc-200",
}: MiniSparklineProps) {
  const filtered = values.filter((v): v is number => v != null && Number.isFinite(v));

  if (filtered.length < 2) {
    return (
      <svg width={width} height={height} className="overflow-visible">
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth={1}
          className="stroke-zinc-600"
        />
      </svg>
    );
  }

  const min = Math.min(...filtered, 0);
  const max = Math.max(...filtered, 0);
  const range = max - min || 1;
  const pad = 2;
  const h = height - pad * 2;
  const w = width - pad * 2;
  const points = filtered.map((v, i) => {
    const x = pad + (i / (filtered.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const d = `M ${points.join(" L ")}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={d}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeClassName}
      />
    </svg>
  );
}
