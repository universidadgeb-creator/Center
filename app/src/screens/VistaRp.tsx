import { useMemo, useState } from 'react';
import type { Member } from '../lib/types';
import { checkStyle, initialsOf, pillBtnStyle, riskBadgeStyle, tierColor, formatDate } from '../lib/style';

type RpFilter = 'todos' | 'sinapp' | 'sinsportlab' | 'sinkeepgoing' | 'riesgoalto';

const RP_FILTERS: { id: RpFilter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'sinapp', label: 'Sin APP' },
  { id: 'sinsportlab', label: 'Sin SPORTLAB' },
  { id: 'sinkeepgoing', label: 'Sin Keep Going' },
  { id: 'riesgoalto', label: 'Riesgo alto' },
];

function KpiCard({ label, count, pct, color, pctLabel }: { label: string; count: number; pct: number; color: string; pctLabel: string }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#948F86' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>{count}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color }}>{pctLabel}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: '#EEEBE5', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function VistaRp({ members, onViewProfile }: { members: Member[]; onViewProfile: (id: string) => void }) {
  const reps = useMemo(
    () => Array.from(new Set(members.map(m => m.rp).filter((r): r is string => !!r))).sort(),
    [members]
  );
  const [currentRp, setCurrentRp] = useState<string>('');
  const activeRp = currentRp || reps[0] || '';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RpFilter>('todos');
  const [showAll, setShowAll] = useState(false);

  const rpAll = useMemo(() => members.filter(m => m.rp === activeRp), [members, activeRp]);
  const total = rpAll.length;

  const kpi = (count: number) => {
    const pct = total ? Math.round((count / total) * 100) : 0;
    return { count, pct, pctLabel: `${pct}%`, color: tierColor(pct) };
  };
  const kpis = {
    encuesta: { count: total, pct: 100, pctLabel: '100%', color: '#1E7A42' },
    app: kpi(rpAll.filter(m => m.app_downloaded).length),
    sportlab: kpi(rpAll.filter(m => m.sportlab).length),
    keepgoing: kpi(rpAll.filter(m => m.keepgoing).length),
  };

  let filtered = rpAll;
  if (filter === 'sinapp') filtered = filtered.filter(m => !m.app_downloaded);
  else if (filter === 'sinsportlab') filtered = filtered.filter(m => !m.sportlab);
  else if (filter === 'sinkeepgoing') filtered = filtered.filter(m => !m.keepgoing);
  else if (filter === 'riesgoalto') filtered = filtered.filter(m => m.risk === 'Alto');
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(m => m.name.toLowerCase().includes(q));
  }

  const limit = 3;
  const visible = showAll ? filtered : filtered.slice(0, limit);

  if (reps.length === 0) {
    return (
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 32 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8B877F', fontSize: 14 }}>
          Aún no hay socios con un RP asignado. Asígnalos desde Concentrado.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 64, height: 64, borderRadius: 999, background: '#EFEDE9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, color: '#4A4640', flex: 'none' }}>
          {initialsOf(activeRp)}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>{activeRp}</div>
          <div style={{ fontSize: 13, color: '#8B877F' }}>{total} socios asignados</div>
        </div>
        {reps.length > 1 && (
          <select
            value={activeRp}
            onChange={e => { setCurrentRp(e.target.value); setShowAll(false); }}
            style={{ border: '1px solid #E4E1DC', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', color: '#2B2926', background: '#fff' }}
          >
            {reps.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <KpiCard label="Encuesta hecha" {...kpis.encuesta} />
        <KpiCard label="APP Descargada" {...kpis.app} />
        <KpiCard label="SPORTLAB" {...kpis.sportlab} />
        <KpiCard label="KEEP GOING" {...kpis.keepgoing} />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar socio por nombre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 220, border: '1px solid #E4E1DC', borderRadius: 8, padding: '9px 14px', fontSize: 14, fontFamily: 'inherit', color: '#2B2926' }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {RP_FILTERS.map(f => (
            <button key={f.id} style={pillBtnStyle(filter === f.id)} onClick={() => { setFilter(f.id); setShowAll(false); }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E4E1DC', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#FAFAF9' }}>
                <th style={thStyle('left')}>Socio</th>
                <th style={thStyle('center')}>APP</th>
                <th style={thStyle('center')}>SPORTLAB</th>
                <th style={thStyle('center')}>KEEP GOING</th>
                <th style={thStyle('left')}>Riesgo</th>
                <th style={thStyle('left')}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #EEEBE5' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600, color: '#2B2926' }}>{m.name}</span>
                      <span style={{ fontSize: 12, color: '#8B877F' }}>{m.member_no || 'Sin no.'} · {formatDate(m.alta_date)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}><span style={checkStyle(m.app_downloaded)}>{m.app_downloaded ? '✓' : '✕'}</span></td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}><span style={checkStyle(m.sportlab)}>{m.sportlab ? '✓' : '✕'}</span></td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}><span style={checkStyle(m.keepgoing)}>{m.keepgoing ? '✓' : '✕'}</span></td>
                  <td style={{ padding: '14px 20px' }}><span style={riskBadgeStyle(m.risk, m.abandono_score)}>{m.risk || 'Sin evaluar'}</span></td>
                  <td style={{ padding: '14px 20px' }}>
                    <button
                      onClick={() => onViewProfile(m.id)}
                      style={{ background: 'none', border: '1px solid #D9D5CE', padding: '6px 14px', borderRadius: 7, fontSize: 13, color: '#2B2926', cursor: 'pointer' }}
                    >
                      Ver perfil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E4E1DC', fontSize: 13, color: '#8B877F' }}>
          <span>Mostrando {visible.length} de {filtered.length} socios</span>
          {!showAll && filtered.length > limit && (
            <button
              onClick={() => setShowAll(true)}
              style={{ background: 'none', border: 'none', color: '#1D4ED8', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
              Ver todos
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

function thStyle(align: 'left' | 'center'): React.CSSProperties {
  return { textAlign: align, padding: '12px 20px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#948F86', fontWeight: 500, borderBottom: '1px solid #E4E1DC' };
}
