import type { CSSProperties } from 'react';
import type { Risk } from './types';

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return initials.toUpperCase() || '?';
}

const RISK_NEUTRAL = { bg: '#F1EFEA', text: '#928D85' };
const RISK_GREEN = { bg: '#E8F5EC', text: '#1E7A42' };
const RISK_YELLOW = { bg: '#FDF3DF', text: '#92610A' };
const RISK_RED = { bg: '#FBEAEA', text: '#B42318' };

/** Score-based palette used everywhere risk is shown: 9-10 verde, 7-8 amarillo, ≤6 rojo. */
export function riskScoreColors(score: number | null | undefined): { bg: string; text: string } {
  if (score === null || score === undefined) return RISK_NEUTRAL;
  if (score >= 9) return RISK_GREEN;
  if (score >= 7) return RISK_YELLOW;
  return RISK_RED;
}

/** Category-only palette, used as a fallback when no numeric score is available. */
export function riskCategoryColors(risk: Risk | null | undefined): { bg: string; text: string } {
  if (risk === 'Alto') return RISK_RED;
  if (risk === 'Medio') return RISK_YELLOW;
  if (risk === 'Bajo') return RISK_GREEN;
  return RISK_NEUTRAL;
}

/** Prefers the numeric abandono_score (9-10 verde · 7-8 amarillo · ≤6 rojo); falls back to the risk category text. */
export function riskColors(risk: Risk | null | undefined, score?: number | null): { bg: string; text: string } {
  if (score === null || score === undefined) return riskCategoryColors(risk);
  return riskScoreColors(score);
}

export function riskBadgeStyle(risk: Risk | null | undefined, score?: number | null): CSSProperties {
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

/** ≥70% blue · ≥40% yellow · <40% red · 100% green */
export function tierColor(pct: number): string {
  if (pct >= 100) return '#1E7A42';
  if (pct >= 70) return '#1D4ED8';
  if (pct >= 40) return '#B45309';
  return '#B42318';
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
    background: active ? '#18181B' : 'transparent',
    color: active ? '#FFFFFF' : '#57534E',
    whiteSpace: 'nowrap',
  };
}

export function pillBtnStyle(active: boolean): CSSProperties {
  return {
    padding: '8px 16px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    border: active ? '1px solid #18181B' : '1px solid #E4E1DC',
    cursor: 'pointer',
    background: active ? '#18181B' : '#FFFFFF',
    color: active ? '#FFFFFF' : '#57534E',
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
