/**
 * Dependency-free chart primitives (pure SVG/CSS).
 * Kept minimal on purpose - readable at a glance, themeable via tokens.
 */

/** Vertical bars: data = [{ label, value }]. */
export function BarChart({ data, height = 150, formatValue = (v) => v }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="chart" style={{ height }} role="img" aria-label={data.map((d) => `${d.label}: ${formatValue(d.value)}`).join(', ')}>
      {data.map(({ label, value }, i) => (
        <div key={`${label}-${i}`} className="chart-col" title={`${label}: ${formatValue(value)}`}>
          <span className="chart-value">{value > 0 ? formatValue(value) : ''}</span>
          <span
            className={`chart-bar${value === 0 ? ' zero' : ''}`}
            style={{ height: `${Math.max((value / max) * 100, value > 0 ? 6 : 2)}%` }}
          />
          <span className="chart-label">{label}</span>
        </div>
      ))}
    </div>
  );
}

/** Horizontal ranked rows: data = [{ label, value, hint? }]. */
export function HBarList({ data, total }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="hbar-list" aria-label="Ranked breakdown">
      {data.map(({ label, value, hint }) => (
        <li key={label} className="hbar-row">
          <span className="hbar-label">{label}</span>
          <span className="hbar-track">
            <span className="hbar-fill" style={{ width: `${(value / max) * 100}%` }} />
          </span>
          <span className="hbar-value">{hint || value}{total ? ` / ${total}` : ''}</span>
        </li>
      ))}
    </ul>
  );
}
