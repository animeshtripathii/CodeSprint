/* ── Sparkline mini chart helper ── */
export default function Sparkline({ data, color = '#8b5cf6', width = 130, height = 45, id }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = (max - min) || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / range) * (height * 0.7) - height * 0.12
  ]);

  // Generate smooth cubic bezier SVG path
  let line = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const cp1x = curr[0] + (next[0] - curr[0]) / 2;
    const cp1y = curr[1];
    const cp2x = curr[0] + (next[0] - curr[0]) / 2;
    const cp2y = next[1];
    line += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${next[0].toFixed(1)} ${next[1].toFixed(1)}`;
  }

  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const gradId = `sp-${id || 'x'}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="60%" stopColor={color} stopOpacity="0.1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
