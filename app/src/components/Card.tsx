import type { CSSProperties, ReactNode } from 'react';
import { color, radius } from '../lib/tokens';

/** The white bordered rounded box repeated across every screen (KPIs, indicator panels, list rows, forms). */
export function Card({
  children,
  style,
  gap = 8,
  padding = 20,
}: {
  children: ReactNode;
  style?: CSSProperties;
  gap?: number;
  padding?: number;
}) {
  return (
    <div
      style={{
        background: color.surface,
        border: `1px solid ${color.border}`,
        borderRadius: radius.lg,
        padding,
        display: 'flex',
        flexDirection: 'column',
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Small uppercase label used above every KPI/metric value. */
export function Eyebrow({ children, color: textColor = color.eyebrow }: { children: ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: textColor }}>
      {children}
    </div>
  );
}

/** Centered "nothing here" placeholder used by every list/table when it has zero rows. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Card style={{ textAlign: 'center', color: color.textMuted, fontSize: 14 }} padding={32}>
      {children}
    </Card>
  );
}
