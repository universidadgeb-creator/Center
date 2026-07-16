import { useMemo, useState } from 'react';
import type { Lead, LeadGoal } from '../lib/types';
import { formatDate, initialsOf, pctColor, pctLabel, checkStyle, pillBtnStyle } from '../lib/style';
import { formatMonthLabel, monthKey } from '../lib/date';
import { isClosedStatus, isWonStatus, leadStatusColor, LEAD_STATUSES, LEAD_ESTRATEGIAS } from '../lib/leadStatus';
import { Card, Eyebrow, EmptyState } from '../components/Card';

const GENERAL_RP = '';

function KpiCard({ label, count, total, suffix }: { label: string; count: number; total: number; suffix?: string }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  const color = pctColor(count, total);
  return (
    <Card>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>{count}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color }}>{suffix ?? pctLabel(count, total)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: '#EEEBE5', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, width: `${pct}%` }} />
      </div>
    </Card>
  );
}

/** Compact label+count+pct row with a colored identity dot — mirrors Concentrado's DistributionRow. */
function DistributionRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: color, flex: 'none' }} />
      <span style={{ color: '#6E6A64', flex: 1 }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#2B2926' }}>{count} · {pctLabel(count, total)}</span>
    </div>
  );
}

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
  const tour = scopedRpLeads.filter(l => l.tour).length;
  const won = scopedRpLeads.filter(l => isWonStatus(l.status)).length;
  const expedienteCompleto = scopedRpLeads.filter(l => l.member_id).length;
  const conApp = scopedRpLeads.filter(l => l.app_downloaded || l.member_id).length;
  const conEncuesta = scopedRpLeads.filter(l => l.member_id).length;

  const wonLeads = scopedRpLeads.filter(l => isWonStatus(l.status));
  const montoTotal = wonLeads.reduce((sum, l) => sum + (l.monto_con_iva ?? 0), 0);
  const ticketPromedio = wonLeads.length ? montoTotal / wonLeads.length : 0;
  const diasCierre = wonLeads
    .filter(l => l.fecha_cierre)
    .map(l => (new Date(l.fecha_cierre!).getTime() - new Date(l.fecha_asignacion!).getTime()) / 86400000)
    .filter(d => Number.isFinite(d) && d >= 0);
  const promedioDiasCierre = diasCierre.length ? diasCierre.reduce((a, b) => a + b, 0) / diasCierre.length : null;

  const statusDist = LEAD_STATUSES
    .map(s => ({ label: s, count: scopedRpLeads.filter(l => l.status === s).length, color: leadStatusColor(s) }))
    .filter(s => s.count > 0);

  const estrategiaDist = LEAD_ESTRATEGIAS
    .map(e => ({ label: e, count: scopedRpLeads.filter(l => l.estrategia === e).length }))
    .filter(e => e.count > 0);

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

  const [tab, setTab] = useState<'proceso' | 'cerrados'>('proceso');
  const [pendientesOnly, setPendientesOnly] = useState(false);
  const enProceso = rpLeads.filter(l => !isClosedStatus(l.status));
  const cerrados = rpLeads.filter(l => isClosedStatus(l.status));
  const pendientesCount = rpLeads.filter(l => l.status === 'Nuevo').length;
  const list = (tab === 'proceso' ? enProceso : cerrados).filter(l => !pendientesOnly || l.status === 'Nuevo');

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
        <Card>
          <Eyebrow>Leads totales</Eyebrow>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>{total}</div>
        </Card>
        <KpiCard label="% Lead → Tour" count={tour} total={total} />
        <KpiCard label="% Tour → Alta" count={won} total={tour} />
        <KpiCard label="Expedientes completos" count={expedienteCompleto} total={total} suffix={`de ${total}`} />
        <KpiCard label="Con APP" count={conApp} total={total} suffix={`de ${total}`} />
        <KpiCard label="Con encuesta" count={conEncuesta} total={total} suffix={`de ${total}`} />
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
        <Card gap={10}>
          <Eyebrow>Distribución por status</Eyebrow>
          {statusDist.map(s => <DistributionRow key={s.label} label={s.label} count={s.count} total={total} color={s.color} />)}
          {statusDist.length === 0 && <div style={{ fontSize: 12, color: '#ACA79E' }}>Sin leads en este periodo.</div>}
        </Card>

        <Card gap={10}>
          <Eyebrow>Distribución por estrategia</Eyebrow>
          {estrategiaDist.map(e => <DistributionRow key={e.label} label={e.label} count={e.count} total={total} color="#57534E" />)}
          {estrategiaDist.length === 0 && <div style={{ fontSize: 12, color: '#ACA79E' }}>Sin leads con estrategia registrada.</div>}
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={pillBtnStyle(tab === 'proceso')} onClick={() => setTab('proceso')}>En proceso ({enProceso.length})</button>
        <button style={pillBtnStyle(tab === 'cerrados')} onClick={() => setTab('cerrados')}>Cerrados ({cerrados.length})</button>
        <button style={pillBtnStyle(pendientesOnly)} onClick={() => setPendientesOnly(v => !v)}>Pendientes ({pendientesCount})</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6E6A64' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#EAF1FB', border: '1px solid #C7D9F0', flex: 'none' }} />
          Pendiente de contactar (Nuevo)
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState>{tab === 'proceso' ? 'No hay leads en proceso.' : 'Aún no hay leads cerrados.'}</EmptyState>
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
