import { useMemo, useState } from 'react';
import type { Lead, LeadGoal } from '../lib/types';
import { formatDate, initialsOf, pctColor, pctLabel, checkStyle, coloredPillBtnStyle, pillBtnStyle } from '../lib/style';
import { formatMonthLabel, monthKey } from '../lib/date';
import {
  isNegativeClosed, isPositiveClosed, isWonStatus, leadStatusColor,
  LEAD_STATUSES, LEAD_ESTRATEGIAS, LEAD_CATEGORY_FILTERS, STATUS_GROUPS,
  computeLeadBuckets, leadBucketRows, matchesLeadCategory,
} from '../lib/leadStatus';
import { Card, Eyebrow, EmptyState } from '../components/Card';
import { DonutChart, KpiBarCard, MagnitudeBar, StackedBar } from '../components/Chart';

const GENERAL_RP = '';
const WON_ONLY_ACCENT = '#7C3AED';

function MetaRow({ label, meta, real, onSaveMeta }: { label: string; meta: number; real: number; onSaveMeta: (value: number) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#2B2926' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#8B877F' }}>Meta</span>
        <input
          type="number"
          min={0}
          defaultValue={meta}
          onBlur={e => {
            const v = Number(e.target.value) || 0;
            if (v !== meta) onSaveMeta(v);
          }}
          style={{ width: 70, border: '1px solid #E4E1DC', borderRadius: 6, padding: '5px 8px', fontSize: 13, fontFamily: 'inherit', color: '#2B2926' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 110, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#18181B' }}>{real}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: pctColor(real, meta) }}>{pctLabel(real, meta)}</span>
      </div>
    </div>
  );
}

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

export function LeadsSeguimientoRp({
  leads,
  goals,
  setGoal,
}: {
  leads: Lead[];
  goals: LeadGoal[];
  setGoal: (month: string, rp: string, meta_altas: number) => void;
}) {
  const months = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => {
      const k = monthKey(l.fecha_asignacion);
      if (k) set.add(k);
    });
    return Array.from(set).sort();
  }, [leads]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<'todos' | string>(months.includes(currentMonth) ? currentMonth : 'todos');
  const [showGoals, setShowGoals] = useState(false);

  const scoped = useMemo(() => {
    if (selectedMonth === 'todos') return leads;
    return leads.filter(l => monthKey(l.fecha_asignacion) === selectedMonth);
  }, [leads, selectedMonth]);

  const reps = useMemo(
    () => Array.from(new Set(scoped.map(l => l.rp).filter((r): r is string => !!r))).sort(),
    [scoped]
  );
  const [currentRp, setCurrentRp] = useState('');
  const activeRp = currentRp || reps[0] || '';

  const rpLeads = useMemo(() => leads.filter(l => l.rp === activeRp), [leads, activeRp]);
  const scopedRpLeads = useMemo(() => scoped.filter(l => l.rp === activeRp), [scoped, activeRp]);

  const total = scopedRpLeads.length;
  // Tour → Alta needs every lead that ever toured, including ones that have since closed.
  const tourAll = scopedRpLeads.filter(l => l.tour).length;
  // Lead → Tour only makes sense against leads still active in the funnel — see the same note
  // in Concentrado de Leads (LeadsPizarra.tsx).
  const tourScoped = useMemo(() => scopedRpLeads.filter(l => !isPositiveClosed(l.status) && !isNegativeClosed(l.status)), [scopedRpLeads]);
  const tour = tourScoped.filter(l => l.tour).length;
  const won = scopedRpLeads.filter(l => isWonStatus(l.status)).length;

  // Expediente/encuesta/APP only ever apply once a lead has actually closed as a sale — see
  // the same note in Concentrado de Leads (LeadsPizarra.tsx).
  const wonLeads = scopedRpLeads.filter(l => isWonStatus(l.status));
  const expedienteCompleto = wonLeads.filter(l => l.member_id).length;
  const conApp = wonLeads.filter(l => l.app_downloaded || l.member_id).length;
  const conEncuesta = wonLeads.filter(l => l.member_id).length;

  const montoTotal = wonLeads.reduce((sum, l) => sum + (l.monto_con_iva ?? 0), 0);
  const ticketPromedio = wonLeads.length ? montoTotal / wonLeads.length : 0;
  const diasCierre = wonLeads
    .filter(l => l.fecha_cierre)
    .map(l => (new Date(l.fecha_cierre!).getTime() - new Date(l.fecha_asignacion!).getTime()) / 86400000)
    .filter(d => Number.isFinite(d) && d >= 0);
  const promedioDiasCierre = diasCierre.length ? diasCierre.reduce((a, b) => a + b, 0) / diasCierre.length : null;

  const buckets = useMemo(() => computeLeadBuckets(scopedRpLeads), [scopedRpLeads]);
  const rpCierrePositivos = scopedRpLeads.filter(l => isPositiveClosed(l.status)).length;
  const rpCierreNegativos = scopedRpLeads.filter(l => isNegativeClosed(l.status)).length;
  const rpCierrePendientes = total - rpCierrePositivos - rpCierreNegativos;
  const rpCierrePct = total ? Math.round((rpCierrePositivos / total) * 100) : 0;

  const statusDist = LEAD_STATUSES
    .map(s => ({ label: s, count: scopedRpLeads.filter(l => l.status === s).length, color: leadStatusColor(s) }))
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);

  const statusGroupDist = STATUS_GROUPS
    .map(g => ({ label: g.label, color: g.color, count: scopedRpLeads.filter(l => g.statuses.includes(l.status)).length }))
    .filter(g => g.count > 0)
    .sort((a, b) => b.count - a.count);

  const estrategiaDist = LEAD_ESTRATEGIAS
    .map(e => ({ label: e, count: scopedRpLeads.filter(l => l.estrategia === e).length }))
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count);

  const goalsByRp = useMemo(() => {
    const map = new Map<string, number>();
    goals.filter(g => g.month === selectedMonth).forEach(g => map.set(g.rp, g.meta_altas));
    return map;
  }, [goals, selectedMonth]);

  const allReps = useMemo(
    () => Array.from(new Set(leads.map(l => l.rp).filter((r): r is string => !!r))).sort(),
    [leads]
  );
  const repMetaRows = allReps.map(rp => ({
    rp,
    meta: goalsByRp.get(rp) ?? 0,
    real: scoped.filter(l => l.rp === rp && isWonStatus(l.status)).length,
  }));
  const generalMeta = goalsByRp.get(GENERAL_RP) ?? 0;
  const generalReal = scoped.filter(l => isWonStatus(l.status)).length;

  const [categoryFilter, setCategoryFilter] = useState<typeof LEAD_CATEGORY_FILTERS[number]['key']>('todos');
  const [encuestaOnly, setEncuestaOnly] = useState(false);
  const list = rpLeads
    .filter(l => matchesLeadCategory(l.status, categoryFilter))
    .filter(l => !encuestaOnly || (isWonStatus(l.status) && !l.member_id));

  if (allReps.length === 0) {
    return (
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 32 }}>
        <EmptyState>Aún no hay leads con un RP asignado.</EmptyState>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
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
        <button
          onClick={() => setShowGoals(s => !s)}
          style={{ background: 'none', border: '1px solid #D9D5CE', padding: '10px 16px', borderRadius: 8, fontSize: 13, color: '#2B2926', cursor: 'pointer' }}
        >
          {showGoals ? 'Cerrar metas' : 'Definir metas'}
        </button>
      </div>

      {showGoals && (
        selectedMonth === 'todos' ? (
          <Card style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, color: '#8B877F' }}>Selecciona un mes específico para definir metas por RP.</div>
          </Card>
        ) : (
          <Card gap={14}>
            <Eyebrow>Metas de altas · {formatMonthLabel(selectedMonth)}</Eyebrow>
            <MetaRow label="General" meta={generalMeta} real={generalReal} onSaveMeta={v => setGoal(selectedMonth, GENERAL_RP, v)} />
            {repMetaRows.map(r => (
              <MetaRow key={r.rp} label={r.rp} meta={r.meta} real={r.real} onSaveMeta={v => setGoal(selectedMonth, r.rp, v)} />
            ))}
            {repMetaRows.length === 0 && (
              <div style={{ fontSize: 12, color: '#ACA79E' }}>Aún no hay leads con RP asignado este mes.</div>
            )}
          </Card>
        )
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 64, height: 64, borderRadius: 999, background: '#B9FF66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#191A23', flex: 'none' }}>
          {initialsOf(activeRp)}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>{activeRp}</div>
          <div style={{ fontSize: 13, color: '#8B877F' }}>{total} leads asignados{selectedMonth !== 'todos' ? ` · ${formatMonthLabel(selectedMonth)}` : ''}</div>
        </div>
        {reps.length > 1 && (
          <select
            value={activeRp}
            onChange={e => setCurrentRp(e.target.value)}
            style={{ border: '1px solid #E4E1DC', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', color: '#2B2926', background: '#fff' }}
          >
            {reps.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <Card gap={12} style={{ gridColumn: 'span 2' }}>
          <Eyebrow>Leads totales</Eyebrow>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>{total}</div>
          {leadBucketRows(buckets).map(r => (
            <MagnitudeBar key={r.key} label={r.label} count={r.count} total={buckets.total} hue={r.hue} title={r.title} />
          ))}
        </Card>
        <Card gap={10}>
          <Eyebrow>Lead → Tour → Alta</Eyebrow>
          <MagnitudeBar label="Lead → Tour" count={tour} total={tourScoped.length} title="Leads que agendaron tour, sin contar los ya cerrados (positivos o negativos)." />
          <MagnitudeBar label="Tour → Alta" count={won} total={tourAll} title="De los leads con tour, cuántos terminaron en venta cerrada." />
        </Card>
        <KpiBarCard label="Expedientes completos" count={expedienteCompleto} total={wonLeads.length} accent={WON_ONLY_ACCENT} title="Leads con venta cerrada que ya tienen encuesta contestada y APP descargada. Solo aplica a leads con 100% Venta." />
        <KpiBarCard label="Con APP" count={conApp} total={wonLeads.length} accent={WON_ONLY_ACCENT} title="Leads con venta cerrada que ya descargaron la app. Solo aplica a leads con 100% Venta." />
        <KpiBarCard label="Con encuesta" count={conEncuesta} total={wonLeads.length} accent={WON_ONLY_ACCENT} title="Leads con venta cerrada que ya contestaron la encuesta y quedaron vinculados a un socio. Solo aplica a leads con 100% Venta." />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <Card>
          <Eyebrow>Monto vendido</Eyebrow>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>{currency.format(montoTotal)}</div>
        </Card>
        <Card>
          <Eyebrow>Ticket promedio</Eyebrow>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>{wonLeads.length ? currency.format(ticketPromedio) : '—'}</div>
        </Card>
        <Card>
          <Eyebrow>Días promedio a cierre</Eyebrow>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>{promedioDiasCierre !== null ? Math.round(promedioDiasCierre) : '—'}</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <Card gap={12}>
          <Eyebrow>Resumen de status (agrupado)</Eyebrow>
          {statusGroupDist.length > 0 ? (
            <DonutChart slices={statusGroupDist.map(g => ({ label: g.label, count: g.count, color: g.color }))} />
          ) : (
            <div style={{ fontSize: 12, color: '#ACA79E' }}>Sin leads en este periodo.</div>
          )}
          <div style={{ borderTop: '1px solid #EEEBE5', paddingTop: 12, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <Eyebrow>% de cierre</Eyebrow>
              <span style={{ fontWeight: 700, color: pctColor(rpCierrePositivos, total) }}>{rpCierrePct}% cierre</span>
            </div>
            <StackedBar height={12} segments={[
              { label: 'Cerrados positivos', count: rpCierrePositivos, color: '#1E7A42' },
              { label: 'Cerrados negativos', count: rpCierreNegativos, color: '#B42318' },
              { label: 'Pendientes', count: rpCierrePendientes, color: '#C7C2B8' },
            ]} />
          </div>
        </Card>

        <Card gap={10}>
          <Eyebrow>Distribución por status (detalle)</Eyebrow>
          {statusDist.map(s => <MagnitudeBar key={s.label} label={s.label} count={s.count} total={total} hue={s.color} />)}
          {statusDist.length === 0 && <div style={{ fontSize: 12, color: '#ACA79E' }}>Sin leads en este periodo.</div>}
        </Card>

        <Card gap={10}>
          <Eyebrow>Distribución por estrategia</Eyebrow>
          {estrategiaDist.map(e => <MagnitudeBar key={e.label} label={e.label} count={e.count} total={total} />)}
          {estrategiaDist.length === 0 && <div style={{ fontSize: 12, color: '#ACA79E' }}>Sin leads con estrategia registrada.</div>}
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {LEAD_CATEGORY_FILTERS.map(f => (
          <button
            key={f.key}
            style={f.hue ? coloredPillBtnStyle(categoryFilter === f.key, f.hue) : pillBtnStyle(categoryFilter === f.key)}
            onClick={() => setCategoryFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <button style={coloredPillBtnStyle(encuestaOnly, '#C2410C')} onClick={() => setEncuestaOnly(v => !v)}>Pendientes encuesta</button>
      </div>

      {list.length === 0 ? (
        <EmptyState>No hay leads que coincidan con este filtro.</EmptyState>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E4E1DC', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: 13, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 140 }} />
                <col style={{ width: 180 }} />
                <col />
                <col style={{ width: 70 }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#FAFAF9' }}>
                  <th style={thStyle('left')}>Fecha de asignación</th>
                  <th style={thStyle('left')}>Nombre</th>
                  <th style={thStyle('left')}>Status</th>
                  <th style={thStyle('center')}>Tour</th>
                </tr>
              </thead>
              <tbody>
                {list.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #EEEBE5', background: l.status === 'Nuevo' ? '#EAF1FB' : undefined }}>
                    <td style={{ padding: '14px 20px', color: '#4A4640' }}>{formatDate(l.fecha_asignacion)}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#2B2926' }}>{l.nombre}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: leadStatusColor(l.status) }}>{l.status}</span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <span style={checkStyle(l.tour)}>{l.tour ? '✓' : '✕'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid #E4E1DC', fontSize: 13, color: '#8B877F' }}>
            <span>Mostrando {list.length} de {rpLeads.length} leads</span>
          </div>
        </div>
      )}

    </div>
  );
}

function thStyle(align: 'left' | 'center'): React.CSSProperties {
  return { textAlign: align, padding: '12px 20px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#948F86', fontWeight: 500, borderBottom: '2px solid #191A23' };
}
