import { color } from '../lib/tokens';
import { pctColor, pctLabel } from '../lib/style';
import { Card, Eyebrow } from './Card';

/** KPI card with a "count de total" line, a % label, and a progress bar underneath — used
 * everywhere a metric is naturally "X out of Y" (tour rate, close rate, app adoption). */
export function KpiBarCard({
  label,
  count,
  total,
  accent,
  title,
}: {
  label: string;
  count: number;
  total: number;
  /** Left-border + tinted background, for metrics that need to visually stand apart (e.g. a
   * different scope/denominator than the rest of the row). */
  accent?: string;
  /** Native hover tooltip explaining what the indicator measures. */
  title?: string;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  const barColor = pctColor(count, total);
  return (
    <Card title={title} style={accent ? { borderLeft: `4px solid ${accent}`, background: `${accent}0D` } : undefined}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 600, color: '#18181B' }}>{count}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: barColor }}>{pctLabel(count, total)} · de {total}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: '#EEEBE5', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: barColor, width: `${pct}%` }} />
      </div>
    </Card>
  );
}

export interface StackedBarSegment {
  label: string;
  count: number;
  color: string;
}

/**
 * Part-to-whole horizontal bar — one row split proportionally between segments, so "most of
 * our socios are X" reads at a glance instead of comparing separate independent bars.
 * A 2px surface-color gap separates touching segments; the legend below always shows the
 * label + value in text (never color-alone identity), per the riesgo palette's CVD note.
 */
export function StackedBar({ segments, height = 18 }: { segments: StackedBarSegment[]; height?: number }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', height, borderRadius: height / 2, overflow: 'hidden', background: color.surface }}>
        {total === 0 ? (
          <div style={{ width: '100%', background: color.rowDivider }} />
        ) : (
          segments.map((s, i) => {
            const pct = (s.count / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={s.label}
                title={`${s.label}: ${s.count} (${Math.round(pct)}%)`}
                style={{
                  width: `${pct}%`,
                  background: s.color,
                  marginRight: i < segments.length - 1 ? 2 : 0,
                }}
              />
            );
          })
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {segments.map(s => {
          const pct = total ? Math.round((s.count / total) * 100) : 0;
          return (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color, flex: 'none' }} />
              <span style={{ color: color.textQuiet }}>{s.label}</span>
              <span style={{ fontWeight: 600, color: color.textSecondary }}>{s.count} · {pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface DonutSlice {
  label: string;
  count: number;
  color: string;
}

/**
 * Donut chart via a CSS conic-gradient — no charting library needed. Used for the J/K/L
 * "top answers" cards per an explicit user request (the dataviz skill's own default for
 * part-to-whole is a stacked bar, used elsewhere in this file for género/riesgo; a donut is
 * a deliberate override here, not the default). Legend below always shows label + value in
 * text, never color-alone.
 */
export function DonutChart({ slices, size = 108 }: { slices: DonutSlice[]; size?: number }) {
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  let cumulative = 0;
  const stops: string[] = [];
  if (total === 0) {
    stops.push(`${color.rowDivider} 0% 100%`);
  } else {
    slices.forEach(s => {
      if (s.count === 0) return;
      const start = (cumulative / total) * 100;
      cumulative += s.count;
      const end = (cumulative / total) * 100;
      stops.push(`${s.color} ${start}% ${end}%`);
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, borderRadius: '50%', background: `conic-gradient(${stops.join(', ')})`, flex: 'none' }}>
        <div
          style={{
            position: 'absolute', inset: size * 0.28, borderRadius: '50%', background: color.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: color.textSecondary,
          }}
        >
          {total}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        {slices.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color, flex: 'none' }} />
            <span style={{ color: color.textQuiet, flex: 1 }}>{s.label}</span>
            <span style={{ fontWeight: 600, color: color.textSecondary }}>{s.count} · {total ? Math.round((s.count / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Sequential single-hue magnitude bar (all bars share one accent) — for ordered buckets
 * (age ranges) where color-per-bucket would wrongly imply a categorical/status meaning. */
export function MagnitudeBar({ label, count, total, hue = '#1D4ED8', title }: { label: string; count: number; total: number; hue?: string; title?: string }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div title={title} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: color.textQuiet }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: color.textSecondary }}>{count} · {total ? `${pct}%` : '—'}</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: color.rowDivider, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, background: hue, width: `${pct}%` }} />
      </div>
    </div>
  );
}
