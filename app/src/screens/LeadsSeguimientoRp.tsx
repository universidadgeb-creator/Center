import { useMemo, useState } from 'react';
import type { Lead } from '../lib/types';
import { formatDate, initialsOf, pctColor, pctLabel, checkStyle, pillBtnStyle } from '../lib/style';
import { isClosedStatus, isWonStatus, leadStatusColor } from '../lib/leadStatus';
import { Card, Eyebrow, EmptyState } from '../components/Card';

function KpiCard({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  const color = pctColor(count, total);
  return (
    <Card>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>{count}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color }}>{pctLabel(count, total)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: '#EEEBE5', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, width: `${pct}%` }} />
      </div>
    </Card>
  );
}

export function LeadsSeguimientoRp({ leads }: { leads: Lead[] }) {
  const reps = useMemo(
    () => Array.from(new Set(leads.map(l => l.rp).filter((r): r is string => !!r))).sort(),
    [leads]
  );
  const [currentRp, setCurrentRp] = useState('');
  const activeRp = currentRp || reps[0] || '';

  const rpLeads = useMemo(() => leads.filter(l => l.rp === activeRp), [leads, activeRp]);
  const total = rpLeads.length;
  const tour = rpLeads.filter(l => l.tour).length;
  const won = rpLeads.filter(l => isWonStatus(l.status)).length;

  const [tab, setTab] = useState<'proceso' | 'cerrados'>('proceso');
  const enProceso = rpLeads.filter(l => !isClosedStatus(l.status));
  const cerrados = rpLeads.filter(l => isClosedStatus(l.status));
  const list = tab === 'proceso' ? enProceso : cerrados;

  if (reps.length === 0) {
    return (
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 32 }}>
        <EmptyState>Aún no hay leads con un RP asignado.</EmptyState>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 64, height: 64, borderRadius: 999, background: '#B9FF66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#191A23', flex: 'none' }}>
          {initialsOf(activeRp)}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>{activeRp}</div>
          <div style={{ fontSize: 13, color: '#8B877F' }}>{total} leads asignados</div>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <KpiCard label="% Lead → Tour" count={tour} total={total} />
        <KpiCard label="% Cierre" count={won} total={total} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button style={pillBtnStyle(tab === 'proceso')} onClick={() => setTab('proceso')}>En proceso ({enProceso.length})</button>
        <button style={pillBtnStyle(tab === 'cerrados')} onClick={() => setTab('cerrados')}>Cerrados ({cerrados.length})</button>
      </div>

      {list.length === 0 ? (
        <EmptyState>{tab === 'proceso' ? 'No hay leads en proceso.' : 'Aún no hay leads cerrados.'}</EmptyState>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E4E1DC', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#FAFAF9' }}>
                  <th style={thStyle('left')}>Nombre</th>
                  <th style={thStyle('left')}>Fecha de asignación</th>
                  <th style={thStyle('left')}>Status</th>
                  <th style={thStyle('center')}>Tour</th>
                </tr>
              </thead>
              <tbody>
                {list.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #EEEBE5' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#2B2926' }}>{l.nombre}</td>
                    <td style={{ padding: '14px 20px', color: '#4A4640' }}>{formatDate(l.fecha_asignacion)}</td>
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
