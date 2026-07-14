import { useMemo, useState } from 'react';
import type { Member } from '../lib/types';
import { checkStyle, formatDate, pillBtnStyle, riskBadgeStyle, riskCategoryColors, sortHeaderStyle, tierColor } from '../lib/style';
import { formatMonthLabel, monthKey } from '../lib/date';

type SortKey = 'name' | 'rp' | 'app' | 'sportlab' | 'keepgoing' | 'risk' | 'altaDate' | 'estado';
type SortDir = 'asc' | 'desc';
type QuickFilter = 'ninguno' | 'riesgoalto' | 'sinkeepgoing' | 'sinapp' | 'sinsportlab';

const RISK_ORDER: Record<string, number> = { Alto: 0, Medio: 1, Bajo: 2 };

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'center' }[] = [
  { key: 'name', label: 'Socio', align: 'left' },
  { key: 'rp', label: 'RP asignado', align: 'left' },
  { key: 'app', label: 'APP', align: 'center' },
  { key: 'sportlab', label: 'SPORTLAB', align: 'center' },
  { key: 'keepgoing', label: 'KEEP GOING', align: 'center' },
  { key: 'risk', label: 'Riesgo', align: 'left' },
  { key: 'estado', label: 'Estado', align: 'center' },
  { key: 'altaDate', label: 'Fecha de alta', align: 'left' },
];

function normalizeGender(g: string | null): 'Hombre' | 'Mujer' | null {
  if (!g) return null;
  const s = g.trim().toLowerCase();
  if (s.includes('hombre') || s.includes('masculin')) return 'Hombre';
  if (s.includes('mujer') || s.includes('femenin')) return 'Mujer';
  return null;
}

const AGE_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: '18-25', min: 18, max: 25 },
  { label: '26-35', min: 26, max: 35 },
  { label: '36-45', min: 36, max: 45 },
  { label: '46-55', min: 46, max: 55 },
  { label: '56+', min: 56, max: Infinity },
];

const JKL_FIELDS: { field: 'mejorar' | 'abandono' | 'ayudaria'; column: string; label: string }[] = [
  { field: 'mejorar', column: 'J', label: 'Qué siente que más necesita mejorar' },
  { field: 'abandono', column: 'K', label: 'Por qué ha abandonado el ejercicio antes' },
  { field: 'ayudaria', column: 'L', label: 'Qué le ayudaría a mantenerse constante' },
];

function topAnswers(list: Member[], field: 'mejorar' | 'abandono' | 'ayudaria', limit = 4) {
  const counts = new Map<string, number>();
  list.forEach(m => {
    const v = (m[field] || '').trim();
    if (!v) return;
    counts.set(v, (counts.get(v) || 0) + 1);
  });
  const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  return {
    total,
    top: Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([label, count]) => ({ label, count, pct: total ? Math.round((count / total) * 100) : 0 })),
  };
}

function sortMembers(rows: Member[], key: SortKey, dir: SortDir): Member[] {
  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    if (key === 'name') cmp = a.name.localeCompare(b.name);
    else if (key === 'rp') cmp = (a.rp || '').localeCompare(b.rp || '');
    else if (key === 'app') cmp = (b.app_downloaded ? 1 : 0) - (a.app_downloaded ? 1 : 0);
    else if (key === 'sportlab') cmp = (b.sportlab ? 1 : 0) - (a.sportlab ? 1 : 0);
    else if (key === 'keepgoing') cmp = (b.keepgoing ? 1 : 0) - (a.keepgoing ? 1 : 0);
    else if (key === 'risk') cmp = (RISK_ORDER[a.risk ?? ''] ?? 3) - (RISK_ORDER[b.risk ?? ''] ?? 3);
    else if (key === 'estado') cmp = (a.reviewed ? 1 : 0) - (b.reviewed ? 1 : 0);
    else if (key === 'altaDate') cmp = (a.alta_date || '').localeCompare(b.alta_date || '');
    if (cmp === 0) cmp = a.name.localeCompare(b.name);
    return dir === 'desc' ? -cmp : cmp;
  });
  return sorted;
}

function StatBar({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6E6A64' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color }}>{count} · {pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: '#EEEBE5', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, width: `${pct}%` }} />
      </div>
    </div>
  );
}

function IndicatorCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#948F86' }}>{title}</div>
      {children}
    </div>
  );
}

export function Concentrado({
  members,
  onViewProfile,
}: {
  members: Member[];
  onViewProfile: (id: string) => void;
}) {
  const months = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => {
      const k = monthKey(m.alta_date);
      if (k) set.add(k);
    });
    return Array.from(set).sort();
  }, [members]);

  const [selectedMonth, setSelectedMonth] = useState<'todos' | string>('todos');

  const scoped = useMemo(() => {
    if (selectedMonth === 'todos') return members;
    return members.filter(m => monthKey(m.alta_date) === selectedMonth);
  }, [members, selectedMonth]);

  const reps = useMemo(
    () => Array.from(new Set(scoped.map(m => m.rp).filter((r): r is string => !!r))).sort(),
    [scoped]
  );

  const [search, setSearch] = useState('');
  const [rpFilter, setRpFilter] = useState<string>('todos');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ninguno');
  const [sortKey, setSortKey] = useState<SortKey>('risk');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const totalAll = scoped.length;
  const kpiG = (count: number) => {
    const pct = totalAll ? Math.round((count / totalAll) * 100) : 0;
    return { count, pct, pctLabel: `${pct}%`, color: tierColor(pct) };
  };
  const riesgoAltoCount = scoped.filter(m => m.risk === 'Alto').length;
  const pendientesCount = scoped.filter(m => !m.reviewed).length;
  const kpis = {
    app: kpiG(scoped.filter(m => m.app_downloaded).length),
    sportlab: kpiG(scoped.filter(m => m.sportlab).length),
    keepgoing: kpiG(scoped.filter(m => m.keepgoing).length),
    riesgoAlto: { count: riesgoAltoCount, pctLabel: `${totalAll ? Math.round((riesgoAltoCount / totalAll) * 100) : 0}%` },
    pendientes: { count: pendientesCount, pctLabel: `${totalAll ? Math.round((pendientesCount / totalAll) * 100) : 0}%` },
  };

  // Indicadores generales
  const hombres = scoped.filter(m => normalizeGender(m.gender) === 'Hombre').length;
  const mujeres = scoped.filter(m => normalizeGender(m.gender) === 'Mujer').length;
  const generoTotal = hombres + mujeres;
  const pctOfTotal = (count: number) => (totalAll ? Math.round((count / totalAll) * 100) : 0);

  const ageDist = AGE_BUCKETS.map(b => {
    const count = scoped.filter(m => m.age !== null && m.age >= b.min && m.age <= b.max).length;
    return { label: b.label, count, pct: pctOfTotal(count) };
  });
  const ageSinDato = scoped.filter(m => m.age === null).length;

  const riskDist = (['Alto', 'Medio', 'Bajo'] as const).map(r => {
    const count = scoped.filter(m => m.risk === r).length;
    return { label: r, count, pct: pctOfTotal(count), color: riskCategoryColors(r).text };
  });
  const riskSinEvaluar = scoped.filter(m => !m.risk).length;

  let filtered = scoped;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(m => m.name.toLowerCase().includes(q));
  }
  if (rpFilter !== 'todos') filtered = filtered.filter(m => m.rp === rpFilter);
  if (quickFilter === 'riesgoalto') filtered = filtered.filter(m => m.risk === 'Alto');
  else if (quickFilter === 'sinkeepgoing') filtered = filtered.filter(m => !m.keepgoing);
  else if (quickFilter === 'sinapp') filtered = filtered.filter(m => !m.app_downloaded);
  else if (quickFilter === 'sinsportlab') filtered = filtered.filter(m => !m.sportlab);

  filtered = sortMembers(filtered, sortKey, sortDir);

  const setSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const scopeLabel = selectedMonth === 'todos' ? 'General · todos los meses' : formatMonthLabel(selectedMonth);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>Panel general</div>
          <div style={{ fontSize: 13, color: '#8B877F', marginTop: 4 }}>Sucursal Naciones Unidas · {scopeLabel}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>{totalAll}</div>
            <div style={{ fontSize: 12, color: '#8B877F' }}>socios activos</div>
          </div>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{ border: '1px solid #E4E1DC', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', color: '#2B2926', background: '#fff' }}
          >
            <option value="todos">General (todos los meses)</option>
            {months.map(ym => (
              <option key={ym} value={ym}>{formatMonthLabel(ym)}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#948F86' }}>Total socios</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#18181B' }}>{totalAll}</div>
        </div>
        {(['app', 'sportlab', 'keepgoing'] as const).map(k => (
          <div key={k} style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#948F86' }}>
              {k === 'app' ? 'APP Descargada' : k === 'sportlab' ? 'SPORTLAB' : 'KEEP GOING'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 600, color: '#18181B' }}>{kpis[k].count}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: kpis[k].color }}>{kpis[k].pctLabel}</span>
            </div>
          </div>
        ))}
        <div style={{ background: '#FBEAEA', border: '1px solid #F4CCCA', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#B42318' }}>Riesgo alto</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#B42318' }}>{kpis.riesgoAlto.count}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#B42318' }}>{kpis.riesgoAlto.pctLabel}</span>
          </div>
        </div>
        <div style={{ background: '#FDF3DF', border: '1px solid #F3E1B8', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#92610A' }}>Pendientes de revisión</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#92610A' }}>{kpis.pendientes.count}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#92610A' }}>{kpis.pendientes.pctLabel}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#18181B' }}>Indicadores generales</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>

          <IndicatorCard title="Distribución por género">
            <StatBar label="Hombres" count={hombres} pct={pctOfTotal(hombres)} color="#1D4ED8" />
            <StatBar label="Mujeres" count={mujeres} pct={pctOfTotal(mujeres)} color="#B08D45" />
            {generoTotal < totalAll && (
              <div style={{ fontSize: 11, color: '#ACA79E' }}>{totalAll - generoTotal} sin dato de género</div>
            )}
          </IndicatorCard>

          <IndicatorCard title="Distribución de edades">
            {ageDist.map(b => (
              <StatBar key={b.label} label={b.label} count={b.count} pct={b.pct} color={tierColor(b.pct)} />
            ))}
            {ageSinDato > 0 && (
              <div style={{ fontSize: 11, color: '#ACA79E' }}>{ageSinDato} sin dato de edad</div>
            )}
          </IndicatorCard>

          <IndicatorCard title="Distribución de riesgo">
            {riskDist.map(r => (
              <StatBar key={r.label} label={r.label} count={r.count} pct={r.pct} color={r.color} />
            ))}
            {riskSinEvaluar > 0 && (
              <div style={{ fontSize: 11, color: '#ACA79E' }}>{riskSinEvaluar} sin evaluar</div>
            )}
          </IndicatorCard>

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {JKL_FIELDS.map(({ field, column, label }) => {
            const { top, total } = topAnswers(scoped, field);
            return (
              <IndicatorCard key={field} title={`Columna ${column} · ${label}`}>
                {top.length === 0 && <div style={{ fontSize: 12, color: '#ACA79E' }}>Sin respuestas registradas.</div>}
                {top.map(a => (
                  <StatBar key={a.label} label={a.label} count={a.count} pct={a.pct} color="#57534E" />
                ))}
                {total > 0 && <div style={{ fontSize: 11, color: '#ACA79E' }}>{total} respuestas con texto</div>}
              </IndicatorCard>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar socio por nombre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, border: '1px solid #E4E1DC', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: '#2B2926' }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={pillBtnStyle(rpFilter === 'todos')} onClick={() => setRpFilter('todos')}>Todos</button>
          {reps.map(r => (
            <button key={r} style={pillBtnStyle(rpFilter === r)} onClick={() => setRpFilter(r)}>{r}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={pillBtnStyle(quickFilter === 'riesgoalto')} onClick={() => setQuickFilter(f => f === 'riesgoalto' ? 'ninguno' : 'riesgoalto')}>Riesgo alto</button>
          <button style={pillBtnStyle(quickFilter === 'sinkeepgoing')} onClick={() => setQuickFilter(f => f === 'sinkeepgoing' ? 'ninguno' : 'sinkeepgoing')}>Sin Keep Going</button>
          <button style={pillBtnStyle(quickFilter === 'sinapp')} onClick={() => setQuickFilter(f => f === 'sinapp' ? 'ninguno' : 'sinapp')}>Sin APP</button>
          <button style={pillBtnStyle(quickFilter === 'sinsportlab')} onClick={() => setQuickFilter(f => f === 'sinsportlab' ? 'ninguno' : 'sinsportlab')}>Sin SPORTLAB</button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E4E1DC', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#FAFAF9' }}>
                {COLUMNS.map(col => (
                  <th key={col.key} style={{ textAlign: col.align, padding: '12px 20px', borderBottom: '1px solid #E4E1DC', background: '#FAFAF9' }}>
                    <button
                      onClick={() => setSort(col.key)}
                      style={{ ...sortHeaderStyle(), justifyContent: col.align === 'center' ? 'center' : 'flex-start', width: '100%' }}
                    >
                      {col.label}
                      <span>{sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #EEEBE5' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600, color: '#2B2926', cursor: 'pointer' }} onClick={() => onViewProfile(m.id)}>{m.name}</span>
                      <span style={{ fontSize: 12, color: '#8B877F' }}>{m.member_no || 'Sin no. de socio'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#4A4640' }}>{m.rp || 'Sin asignar'}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={checkStyle(m.app_downloaded)}>{m.app_downloaded ? '✓' : '✕'}</span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={checkStyle(m.sportlab)}>{m.sportlab ? '✓' : '✕'}</span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={checkStyle(m.keepgoing)}>{m.keepgoing ? '✓' : '✕'}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}><span style={riskBadgeStyle(m.risk, m.abandono_score)}>{m.risk || 'Sin evaluar'}</span></td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999, display: 'inline-block',
                        background: m.reviewed ? '#E8F5EC' : '#FDF3DF',
                        color: m.reviewed ? '#1E7A42' : '#92610A',
                      }}
                    >
                      {m.reviewed ? 'Revisado' : 'Pendiente'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#4A4640' }}>{formatDate(m.alta_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid #E4E1DC', fontSize: 13, color: '#8B877F' }}>
          <span>Mostrando {filtered.length} de {totalAll} socios</span>
        </div>
      </div>

    </div>
  );
}
