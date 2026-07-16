import { useMemo, useState } from 'react';
import type { Member } from '../lib/types';
import { checkStyle, formatDate, initialsOf, pctColor, pctLabel, pillBtnStyle, riskBadgeStyle, riskCategoryColors, riskLabel, sortHeaderStyle } from '../lib/style';
import { formatMonthLabel, monthKey } from '../lib/date';
import { Card, Eyebrow } from '../components/Card';
import { StackedBar, MagnitudeBar, DonutChart } from '../components/Chart';
import { Drawer } from '../components/Drawer';
import { SocioProfile } from '../components/SocioProfile';

/** Validated 4-color categorical palette for the top-4 J/K/L answer slices; "Otros" always
 * uses the neutral muted gray already used elsewhere on this screen. */
const JKL_COLORS = ['#1D4ED8', '#C4791A', '#15803D', '#9D174D'];

type SortKey = 'altaDate' | 'name' | 'telefono' | 'rp' | 'ejecutivo' | 'app' | 'sportlab' | 'keepgoing' | 'performanceDay' | 'risk' | 'estado';
type SortDir = 'asc' | 'desc';
type QuickFilter = 'ninguno' | 'riesgoalto' | 'sinkeepgoing' | 'sinapp' | 'sinsportlab' | 'sinperformanceday';

const RISK_ORDER: Record<string, number> = { Alto: 0, Medio: 1, Bajo: 2 };

/** Same first-3-column order as Concentrado de Leads (Fecha, Nombre, Teléfono), so the two
 * tables read consistently. */
const COLUMNS: { key: SortKey; label: string; align: 'left' | 'center' }[] = [
  { key: 'altaDate', label: 'Fecha', align: 'left' },
  { key: 'name', label: 'Nombre', align: 'left' },
  { key: 'telefono', label: 'Teléfono', align: 'left' },
  { key: 'rp', label: 'RP asignado', align: 'left' },
  { key: 'ejecutivo', label: 'Ejecutivo', align: 'left' },
  { key: 'app', label: 'APP', align: 'center' },
  { key: 'sportlab', label: 'SPORTLAB', align: 'center' },
  { key: 'keepgoing', label: 'KEEP GOING', align: 'center' },
  { key: 'performanceDay', label: 'Performance Day', align: 'center' },
  { key: 'risk', label: 'Riesgo', align: 'left' },
  { key: 'estado', label: 'Estado', align: 'center' },
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

function topAnswers(list: Member[], field: 'objetivo' | 'mejorar' | 'abandono' | 'ayudaria', limit = 4) {
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
      .map(([label, count]) => ({ label, count })),
  };
}

function sortMembers(rows: Member[], key: SortKey, dir: SortDir): Member[] {
  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    if (key === 'name') cmp = a.name.localeCompare(b.name);
    else if (key === 'telefono') cmp = (a.phone || '').localeCompare(b.phone || '');
    else if (key === 'rp') cmp = (a.rp || '').localeCompare(b.rp || '');
    else if (key === 'ejecutivo') cmp = (a.ejecutivo || '').localeCompare(b.ejecutivo || '');
    else if (key === 'app') cmp = (b.app_downloaded ? 1 : 0) - (a.app_downloaded ? 1 : 0);
    else if (key === 'sportlab') cmp = (b.sportlab ? 1 : 0) - (a.sportlab ? 1 : 0);
    else if (key === 'keepgoing') cmp = (b.keepgoing ? 1 : 0) - (a.keepgoing ? 1 : 0);
    else if (key === 'performanceDay') cmp = (b.performance_day ? 1 : 0) - (a.performance_day ? 1 : 0);
    else if (key === 'risk') cmp = (RISK_ORDER[riskLabel(a.abandono_score, a.risk)] ?? 3) - (RISK_ORDER[riskLabel(b.abandono_score, b.risk)] ?? 3);
    else if (key === 'estado') cmp = (a.member_no ? 1 : 0) - (b.member_no ? 1 : 0);
    else if (key === 'altaDate') cmp = (a.alta_date || '').localeCompare(b.alta_date || '');
    if (cmp === 0) cmp = a.name.localeCompare(b.name);
    return dir === 'desc' ? -cmp : cmp;
  });
  return sorted;
}

function IndicatorCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card gap={14}>
      <Eyebrow>{title}</Eyebrow>
      {children}
    </Card>
  );
}

export function Concentrado({
  members,
}: {
  members: Member[];
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

  const ejecutivos = useMemo(
    () => Array.from(new Set(members.map(m => m.ejecutivo).filter((e): e is string => !!e))).sort(),
    [members]
  );
  const [selectedEjecutivo, setSelectedEjecutivo] = useState('todos');
  const isGeneral = selectedEjecutivo === 'todos';

  // Month-only scope — feeds `reps`/`ejecutivos` option lists and the month selector; the
  // ejecutivo selector narrows further into `scoped` below.
  const monthScoped = useMemo(() => {
    if (selectedMonth === 'todos') return members;
    return members.filter(m => monthKey(m.alta_date) === selectedMonth);
  }, [members, selectedMonth]);

  // Month + ejecutivo scope — feeds every indicator card and the table, so switching the
  // ejecutivo selector re-scopes the whole dashboard instead of only filtering the table.
  const scoped = useMemo(() => {
    if (isGeneral) return monthScoped;
    return monthScoped.filter(m => m.ejecutivo === selectedEjecutivo);
  }, [monthScoped, isGeneral, selectedEjecutivo]);

  const reps = useMemo(
    () => Array.from(new Set(scoped.map(m => m.rp).filter((r): r is string => !!r))).sort(),
    [scoped]
  );

  const [search, setSearch] = useState('');
  const [rpFilter, setRpFilter] = useState<string>('todos');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ninguno');
  const [sortKey, setSortKey] = useState<SortKey>('risk');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null);

  const totalAll = scoped.length;
  const kpiG = (count: number) => ({ count, pctLabel: pctLabel(count, totalAll), color: pctColor(count, totalAll) });
  const pendientesCount = scoped.filter(m => !m.member_no).length;

  const riskDist = (['Alto', 'Medio', 'Bajo'] as const).map(r => {
    const count = scoped.filter(m => riskLabel(m.abandono_score, m.risk) === r).length;
    return { label: r, count, color: riskCategoryColors(r).text };
  });
  const riskSinEvaluar = scoped.filter(m => riskLabel(m.abandono_score, m.risk) === 'Sin evaluar').length;
  const riesgoAltoCount = riskDist.find(r => r.label === 'Alto')?.count ?? 0;

  const kpis = {
    app: kpiG(scoped.filter(m => m.app_downloaded).length),
    sportlab: kpiG(scoped.filter(m => m.sportlab).length),
    keepgoing: kpiG(scoped.filter(m => m.keepgoing).length),
    performanceDay: kpiG(scoped.filter(m => m.performance_day).length),
    riesgoAlto: { count: riesgoAltoCount, pctLabel: pctLabel(riesgoAltoCount, totalAll) },
    pendientes: { count: pendientesCount, pctLabel: pctLabel(pendientesCount, totalAll) },
  };

  // Indicadores generales
  const hombres = scoped.filter(m => normalizeGender(m.gender) === 'Hombre').length;
  const mujeres = scoped.filter(m => normalizeGender(m.gender) === 'Mujer').length;
  const generoTotal = hombres + mujeres;

  const ageDist = AGE_BUCKETS.map(b => {
    const count = scoped.filter(m => m.age !== null && m.age >= b.min && m.age <= b.max).length;
    return { label: b.label, count };
  });
  const ageSinDato = scoped.filter(m => m.age === null).length;

  const { top: objetivoTop, total: objetivoTotal } = topAnswers(scoped, 'objetivo');
  const objetivoTopSum = objetivoTop.reduce((sum, a) => sum + a.count, 0);
  const objetivoOtros = objetivoTotal - objetivoTopSum;
  const objetivoSlices = [
    ...objetivoTop.map((a, i) => ({ label: a.label, count: a.count, color: JKL_COLORS[i] })),
    ...(objetivoOtros > 0 ? [{ label: 'Otros', count: objetivoOtros, color: '#ACA79E' }] : []),
  ];

  let filtered = scoped;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(m => m.name.toLowerCase().includes(q));
  }
  if (rpFilter !== 'todos') filtered = filtered.filter(m => m.rp === rpFilter);
  if (quickFilter === 'riesgoalto') filtered = filtered.filter(m => riskLabel(m.abandono_score, m.risk) === 'Alto');
  else if (quickFilter === 'sinkeepgoing') filtered = filtered.filter(m => !m.keepgoing);
  else if (quickFilter === 'sinapp') filtered = filtered.filter(m => !m.app_downloaded);
  else if (quickFilter === 'sinsportlab') filtered = filtered.filter(m => !m.sportlab);
  else if (quickFilter === 'sinperformanceday') filtered = filtered.filter(m => !m.performance_day);

  filtered = sortMembers(filtered, sortKey, sortDir);

  const setSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const scopeLabel = selectedMonth === 'todos' ? 'General · todos los meses' : formatMonthLabel(selectedMonth);
  const detailMember = detailMemberId ? members.find(m => m.id === detailMemberId) : undefined;

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
            value={selectedEjecutivo}
            onChange={e => setSelectedEjecutivo(e.target.value)}
            style={{ border: '1px solid #E4E1DC', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', color: '#2B2926', background: '#fff' }}
          >
            <option value="todos">General (todos los ejecutivos)</option>
            {ejecutivos.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
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

      {!isGeneral && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: '#B9FF66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#191A23', flex: 'none' }}>
            {initialsOf(selectedEjecutivo)}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#18181B' }}>{selectedEjecutivo}</div>
            <div style={{ fontSize: 13, color: '#8B877F' }}>{totalAll} socios asignados{selectedMonth !== 'todos' ? ` · ${formatMonthLabel(selectedMonth)}` : ''}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1.4fr) repeat(3, minmax(150px, 1fr))', gridAutoRows: 'auto', gap: 16 }}>
        <Card gap={10} style={{ gridColumn: '1', gridRow: '1 / span 2' }}>
          <Eyebrow>Total socios</Eyebrow>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#18181B' }}>{totalAll}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 2 }}>
            {riskDist.map(r => (
              <MagnitudeBar key={r.label} label={`Riesgo ${r.label.toLowerCase()}`} count={r.count} total={totalAll} hue={r.color} />
            ))}
            {riskSinEvaluar > 0 && (
              <MagnitudeBar label="Sin evaluar" count={riskSinEvaluar} total={totalAll} hue="#928D85" />
            )}
          </div>
        </Card>

        <Card style={{ gridColumn: '2', gridRow: '1', background: '#FBEAEA', border: '1px solid #F4CCCA' }}>
          <Eyebrow color="#B42318">Riesgo alto</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#B42318' }}>{kpis.riesgoAlto.count}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#B42318' }}>{kpis.riesgoAlto.pctLabel} · de {totalAll}</span>
          </div>
        </Card>
        <Card style={{ gridColumn: '2', gridRow: '2', background: '#FDF3DF', border: '1px solid #F3E1B8' }}>
          <Eyebrow color="#92610A">Pendientes de revisión</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#92610A' }}>{kpis.pendientes.count}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#92610A' }}>{kpis.pendientes.pctLabel} · de {totalAll}</span>
          </div>
        </Card>

        {(['app', 'sportlab', 'keepgoing', 'performanceDay'] as const).map((k, i) => (
          <Card key={k} style={{ gridColumn: String(3 + (i % 2)), gridRow: String(1 + Math.floor(i / 2)) }}>
            <Eyebrow>{k === 'app' ? 'APP Descargada' : k === 'sportlab' ? 'SPORTLAB' : k === 'keepgoing' ? 'KEEP GOING' : 'Performance Day'}</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 600, color: '#18181B' }}>{kpis[k].count}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: kpis[k].color }}>{kpis[k].pctLabel} · de {totalAll}</span>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#18181B' }}>Indicadores generales</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>

          <IndicatorCard title="Distribución por género">
            <StackedBar
              segments={[
                { label: 'Hombres', count: hombres, color: '#1D4ED8' },
                { label: 'Mujeres', count: mujeres, color: '#C4791A' },
              ]}
            />
            {generoTotal < totalAll && (
              <div style={{ fontSize: 11, color: '#ACA79E' }}>{totalAll - generoTotal} sin dato de género</div>
            )}
          </IndicatorCard>

          <IndicatorCard title="Distribución de edades">
            {ageDist.map(b => (
              <MagnitudeBar key={b.label} label={b.label} count={b.count} total={totalAll} />
            ))}
            {ageSinDato > 0 && (
              <div style={{ fontSize: 11, color: '#ACA79E' }}>{ageSinDato} sin dato de edad</div>
            )}
          </IndicatorCard>

          <IndicatorCard title="Columna E · ¿Cuál de las siguientes opciones describe mejor tu principal objetivo?">
            {objetivoTop.length === 0 ? (
              <div style={{ fontSize: 12, color: '#ACA79E' }}>Sin respuestas registradas.</div>
            ) : (
              <DonutChart slices={objetivoSlices} />
            )}
          </IndicatorCard>

        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {JKL_FIELDS.map(({ field, column, label }) => {
            const { top, total } = topAnswers(scoped, field);
            const topSum = top.reduce((sum, a) => sum + a.count, 0);
            const otros = total - topSum;
            const slices = [
              ...top.map((a, i) => ({ label: a.label, count: a.count, color: JKL_COLORS[i] })),
              ...(otros > 0 ? [{ label: 'Otros', count: otros, color: '#ACA79E' }] : []),
            ];
            return (
              <IndicatorCard key={field} title={`Columna ${column} · ${label}`}>
                {top.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#ACA79E' }}>Sin respuestas registradas.</div>
                ) : (
                  <DonutChart slices={slices} />
                )}
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
          <button style={pillBtnStyle(quickFilter === 'sinperformanceday')} onClick={() => setQuickFilter(f => f === 'sinperformanceday' ? 'ninguno' : 'sinperformanceday')}>Sin Performance Day</button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E4E1DC', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#FAFAF9' }}>
                {COLUMNS.map(col => (
                  <th key={col.key} style={{ textAlign: col.align, padding: '12px 20px', borderBottom: '2px solid #191A23', background: '#FAFAF9' }}>
                    <button
                      onClick={() => setSort(col.key)}
                      style={{ ...sortHeaderStyle(), justifyContent: col.align === 'center' ? 'center' : 'flex-start', width: '100%' }}
                    >
                      {col.label}
                      <span style={{ color: '#191A23' }}>{sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #EEEBE5' }}>
                  <td style={{ padding: '14px 20px', color: '#4A4640' }}>{formatDate(m.alta_date)}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600, color: '#2B2926', cursor: 'pointer' }} onClick={() => setDetailMemberId(m.id)}>{m.name}</span>
                      <span style={{ fontSize: 12, color: '#8B877F' }}>{m.member_no || 'Sin no. de socio'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#4A4640' }}>{m.phone || '—'}</td>
                  <td style={{ padding: '14px 20px', color: '#4A4640' }}>{m.rp || 'Sin asignar'}</td>
                  <td style={{ padding: '14px 20px', color: '#4A4640' }}>{m.ejecutivo || 'Sin asignar'}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={checkStyle(m.app_downloaded)}>{m.app_downloaded ? '✓' : '✕'}</span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={checkStyle(m.sportlab)}>{m.sportlab ? '✓' : '✕'}</span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={checkStyle(m.keepgoing)}>{m.keepgoing ? '✓' : '✕'}</span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={checkStyle(m.performance_day)}>{m.performance_day ? '✓' : '✕'}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}><span style={riskBadgeStyle(m.risk, m.abandono_score)}>{riskLabel(m.abandono_score, m.risk)}</span></td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999, display: 'inline-block',
                        background: m.member_no ? '#E8F5EC' : '#FDF3DF',
                        color: m.member_no ? '#1E7A42' : '#92610A',
                      }}
                    >
                      {m.member_no ? 'Revisado' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid #E4E1DC', fontSize: 13, color: '#8B877F' }}>
          <span>Mostrando {filtered.length} de {totalAll} socios</span>
        </div>
      </div>

      {detailMember && (
        <Drawer
          open
          title={detailMember.name}
          subtitle={detailMember.member_no ? `Socio ${detailMember.member_no}` : 'Sin no. de socio'}
          onClose={() => setDetailMemberId(null)}
          width={560}
        >
          <SocioProfile member={detailMember} />
        </Drawer>
      )}

    </div>
  );
}
