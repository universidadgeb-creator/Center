import type { CSSProperties } from 'react';
import type { Risk } from './types';
import { color as tokenColor } from './tokens';

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return initials.toUpperCase() || '?';
}

const RISK_NEUTRAL = { bg: '#F1EFEA', text: '#928D85' };
const RISK_GREEN = { bg: '#E8F5EC', text: '#1E7A42' };
const RISK_ORANGE = { bg: '#FDE9DA', text: '#C2410C' };
const RISK_RED = { bg: '#FBEAEA', text: '#B42318' };

/**
 * The Sheet's "Categoría Riesgo" column (Z / COL.risk in apps-script) turned out to actually
 * hold a raw 1-10 "calificación" number, not the Alto/Medio/Bajo text the column name implies
 * — same scale and thresholds as the sheet's own conditional formatting: 9-10 verde/Bajo,
 * 7-8 naranja/Medio, ≤6 rojo/Alto. `risk` therefore arrives as a numeric string ("8", "6"…)
 * in practice; this parses that case but still honors real "Alto"/"Medio"/"Bajo" text if the
 * sheet mapping is ever corrected upstream.
 */
function parseRiskInput(risk: string | null | undefined, score: number | null | undefined): number | string | null {
  if (risk === 'Alto' || risk === 'Medio' || risk === 'Bajo') return risk;
  const n = risk ? Number(risk) : NaN;
  if (Number.isFinite(n)) return n;
  return score ?? null;
}

/** Score-based palette used everywhere risk is shown: 9-10 verde, 7-8 naranja, ≤6 rojo. */
export function riskScoreColors(score: number | null | undefined): { bg: string; text: string } {
  if (score === null || score === undefined) return RISK_NEUTRAL;
  if (score >= 9) return RISK_GREEN;
  if (score >= 7) return RISK_ORANGE;
  return RISK_RED;
}

/** Category-only palette, used when the risk value is already Alto/Medio/Bajo text. */
export function riskCategoryColors(risk: Risk | null | undefined): { bg: string; text: string } {
  if (risk === 'Alto') return RISK_RED;
  if (risk === 'Medio') return RISK_ORANGE;
  if (risk === 'Bajo') return RISK_GREEN;
  return RISK_NEUTRAL;
}

export function riskColors(risk: string | null | undefined, score?: number | null): { bg: string; text: string } {
  const parsed = parseRiskInput(risk, score);
  if (parsed === null) return RISK_NEUTRAL;
  if (typeof parsed === 'string') return riskCategoryColors(parsed as Risk);
  return riskScoreColors(parsed);
}

/** Derives the displayed risk label from the parsed calificación (see parseRiskInput above). */
export function riskLabel(score: number | null | undefined, risk: string | null | undefined): string {
  const parsed = parseRiskInput(risk, score);
  if (parsed === null) return 'Sin evaluar';
  if (typeof parsed === 'string') return parsed;
  if (parsed >= 9) return 'Bajo';
  if (parsed >= 7) return 'Medio';
  return 'Alto';
}

export function riskBadgeStyle(risk: string | null | undefined, score?: number | null): CSSProperties {
  const c = riskColors(risk, score);
  return {
    background: c.bg,
    color: c.text,
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 999,
    display: 'inline-block',
  };
}

/**
 * ≥70% blue · ≥40% yellow · <40% amber · 100% green.
 * The bottom tier intentionally stays out of the red family (`#B42318`) — that red is
 * reserved for "riesgo alto" (see riskColors below), so a low adoption % never reads as
 * an abandonment-risk alert.
 */
export function tierColor(pct: number): string {
  if (pct >= 100) return '#1E7A42';
  if (pct >= 70) return '#1D4ED8';
  if (pct >= 40) return '#B45309';
  return '#9A5B12';
}

/**
 * tierColor()/label but neutral when there's no data yet (total=0) — otherwise a brand-new
 * branch or month with zero members would render every KPI in tierColor's alarm red, which
 * reads as "doing badly" instead of "nothing to show yet".
 */
export function pctColor(count: number, total: number): string {
  if (total === 0) return '#ACA79E';
  return tierColor(Math.round((count / total) * 100));
}

export function pctLabel(count: number, total: number): string {
  if (total === 0) return '—';
  return `${Math.round((count / total) * 100)}%`;
}

export function checkStyle(active: boolean): CSSProperties {
  return { fontSize: 15, fontWeight: 700, color: active ? '#1E7A42' : '#B0ABA3' };
}

export function checkButtonStyle(active: boolean): CSSProperties {
  return {
    fontSize: 15,
    fontWeight: 700,
    color: active ? '#1E7A42' : '#B0ABA3',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: '2px 4px',
  };
}

export function chipStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    background: active ? '#E8F5EC' : '#F1EFEA',
    color: active ? '#1E7A42' : '#928D85',
  };
}

export function tabBtnStyle(active: boolean): CSSProperties {
  return {
    padding: '8px 18px',
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    background: active ? tokenColor.accent : 'transparent',
    color: active ? tokenColor.accentInk : '#57534E',
    whiteSpace: 'nowrap',
  };
}

export function pillBtnStyle(active: boolean): CSSProperties {
  return {
    padding: '8px 16px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    border: active ? `1px solid ${tokenColor.accentInk}` : '1px solid #E4E1DC',
    cursor: 'pointer',
    background: active ? tokenColor.accent : '#FFFFFF',
    color: active ? tokenColor.accentInk : '#57534E',
  };
}

/** Primary CTA button — the brand-accent block from the Positivus-style references
 * (neon green fill, near-black text) used for the main action on a screen ("Guardar",
 * "+ Nuevo lead", etc.). Not used for table/row-level actions, which stay neutral. */
export function primaryButtonStyle(disabled = false): CSSProperties {
  return {
    background: tokenColor.accent,
    color: tokenColor.accentInk,
    border: 'none',
    padding: '10px 20px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}

export function sortHeaderStyle(): CSSProperties {
  return {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    font: 'inherit',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: '#948F86',
    fontWeight: 500,
  };
}

export function captureRowStyle(): CSSProperties {
  return {
    background: '#FFFFFF',
    border: '1px solid #E4E1DC',
    borderRadius: 10,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  };
}

export function captureInputStyle(): CSSProperties {
  return {
    border: '1px solid #E4E1DC',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    fontFamily: 'inherit',
    color: '#2B2926',
    minWidth: 160,
    flex: '1 1 160px',
  };
}

export function captureToggleStyle(active: boolean): CSSProperties {
  return {
    padding: '10px 18px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    border: active ? '1px solid #1E7A42' : '1px solid #D9D5CE',
    background: active ? '#E8F5EC' : '#FFFFFF',
    color: active ? '#1E7A42' : '#2B2926',
    whiteSpace: 'nowrap',
  };
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${String(d).padStart(2, '0')} ${months[m - 1]} ${y}`;
}
