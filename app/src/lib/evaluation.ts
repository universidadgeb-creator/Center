import type { Member } from './types';

export function getEvaluacion(m: Member) {
  return {
    enfoque: { score: m.enfoque_score, label: m.enfoque_label },
    adherencia: { score: m.adherencia_score },
    frecuencia: { score: m.frecuencia_score },
    condicion: { level: m.condicion_level, score: m.condicion_score },
    riesgo: { score: m.abandono_score },
    nivelGeneral: { label: m.nivel_general_label },
  };
}

export function scoreOrDash(v: number | null): string {
  return v === null || v === undefined ? '—' : String(v);
}
