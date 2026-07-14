import { useMemo, useState } from 'react';
import type { Lead, LeadGoal, LeadInsert, LeadPatch } from '../lib/types';
import { captureInputStyle, formatDate, pillBtnStyle, tierColor } from '../lib/style';
import { formatMonthLabel, monthKey } from '../lib/date';
import { LEAD_ESTRATEGIAS, LEAD_STATUSES, isClosedStatus, isWonStatus } from '../lib/leadStatus';

const GENERAL_RP = '';

function NewLeadForm({ onAdd, onClose, reps }: { onAdd: (lead: LeadInsert) => void; onClose: () => void; reps: string[] }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [estrategia, setEstrategia] = useState('');
  const [rp, setRp] = useState('');

  const submit = () => {
    if (!nombre.trim()) return;
    onAdd({
      nombre: nombre.trim(),
      telefono: telefono.trim() || undefined,
      estrategia: estrategia || undefined,
      rp: rp.trim() || undefined,
    });
    onClose();
  };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#18181B' }}>Nuevo lead</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input type="text" placeholder="Nombre*" value={nombre} onChange={e => setNombre(e.target.value)} style={captureInputStyle()} />
        <input type="text" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} style={captureInputStyle()} />
        <select value={estrategia} onChange={e => setEstrategia(e.target.value)} style={captureInputStyle()}>
          <option value="">Estrategia…</option>
          {LEAD_ESTRATEGIAS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input type="text" list="leads-rp-suggestions" placeholder="RP asignado" value={rp} onChange={e => setRp(e.target.value)} style={captureInputStyle()} />
      </div>
      <datalist id="leads-rp-suggestions">
        {reps.map(r => <option key={r} value={r} />)}
      </datalist>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={submit}
          disabled={!nombre.trim()}
          style={{ background: '#18181B', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: nombre.trim() ? 'pointer' : 'not-allowed', opacity: nombre.trim() ? 1 : 0.5 }}
        >
          Guardar lead
        </button>
        <button
          onClick={onClose}
          style={{ background: 'none', border: '1px solid #D9D5CE', padding: '10px 20px', borderRadius: 8, fontSize: 13, color: '#2B2926', cursor: 'pointer' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function LeadRow({ lead, updateLead }: { lead: Lead; updateLead: (id: string, patch: LeadPatch) => void }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 600, color: '#2B2926' }}>{lead.nombre}</div>
          <div style={{ fontSize: 12, color: '#8B877F' }}>
            {lead.telefono || 'Sin teléfono'} · {lead.estrategia || 'Sin estrategia'} · {lead.rp || 'Sin RP'} · Asignado: {formatDate(lead.fecha_asignacion)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#57534E' }}>
            <input type="checkbox" checked={lead.tour} onChange={e => updateLead(lead.id, { tour: e.target.checked })} />
            Tomó tour
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#57534E' }}>
            <input type="checkbox" checked={lead.app_downloaded} onChange={e => updateLead(lead.id, { app_downloaded: e.target.checked })} />
            APP descargada
          </label>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <select
          value={lead.status}
          onChange={e => updateLead(lead.id, { status: e.target.value, fecha_cierre: isClosedStatus(e.target.value) ? new Date().toISOString().slice(0, 10) : null })}
          style={captureInputStyle()}
        >
          {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="date"
          value={lead.fecha_cita ?? ''}
          onChange={e => updateLead(lead.id, { fecha_cita: e.target.value || null })}
          style={captureInputStyle()}
        />
        <input
          type="text"
          placeholder="Comentarios…"
          defaultValue={lead.comentarios ?? ''}
          onBlur={e => { if (e.target.value !== (lead.comentarios ?? '')) updateLead(lead.id, { comentarios: e.target.value || null }); }}
          style={{ ...captureInputStyle(), flex: '2 1 240px' }}
        />
      </div>
    </div>
  );
}

function MetaRow({ label, meta, real, onSaveMeta }: { label: string; meta: number; real: number; onSaveMeta: (value: number) => void }) {
  const pct = meta ? Math.round((real / meta) * 100) : 0;
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
        <span style={{ fontSize: 12, fontWeight: 600, color: tierColor(pct) }}>{pct}%</span>
      </div>
    </div>
  );
}

export function ConcentradoLeads({
  leads,
  goals,
  addLead,
  updateLead,
  setGoal,
}: {
  leads: Lead[];
  goals: LeadGoal[];
  addLead: (lead: LeadInsert) => void;
  updateLead: (id: string, patch: LeadPatch) => void;
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

  const scoped = useMemo(() => {
    if (selectedMonth === 'todos') return leads;
    return leads.filter(l => monthKey(l.fecha_asignacion) === selectedMonth);
  }, [leads, selectedMonth]);

  const reps = useMemo(
    () => Array.from(new Set(leads.map(l => l.rp).filter((r): r is string => !!r))).sort(),
    [leads]
  );

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'proceso' | 'cerrados'>('proceso');
  const [showForm, setShowForm] = useState(false);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter(l => l.nombre.toLowerCase().includes(q));
  }, [scoped, search]);

  const enProceso = searched.filter(l => !isClosedStatus(l.status));
  const cerrados = searched.filter(l => isClosedStatus(l.status));
  const list = tab === 'proceso' ? enProceso : cerrados;

  const totalLeads = scoped.length;
  const totalTour = scoped.filter(l => l.tour).length;
  const totalVenta = scoped.filter(l => isWonStatus(l.status)).length;
  const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

  const goalsByRp = useMemo(() => {
    const map = new Map<string, number>();
    goals.filter(g => g.month === selectedMonth).forEach(g => map.set(g.rp, g.meta_altas));
    return map;
  }, [goals, selectedMonth]);

  const repMetaRows = reps.map(rp => ({
    rp,
    meta: goalsByRp.get(rp) ?? 0,
    real: scoped.filter(l => l.rp === rp && isWonStatus(l.status)).length,
  }));
  const generalMeta = goalsByRp.get(GENERAL_RP) ?? 0;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>Concentrado · Leads</div>
          <div style={{ fontSize: 13, color: '#8B877F', marginTop: 4 }}>Metas, avance y seguimiento de la operación de leads.</div>
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

      {selectedMonth === 'todos' ? (
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: '16px 20px', fontSize: 13, color: '#8B877F' }}>
          Selecciona un mes específico para definir y ver metas por RP.
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#948F86' }}>
            Metas de altas · {formatMonthLabel(selectedMonth)}
          </div>
          <MetaRow label="General" meta={generalMeta} real={totalVenta} onSaveMeta={v => setGoal(selectedMonth, GENERAL_RP, v)} />
          {repMetaRows.map(r => (
            <MetaRow key={r.rp} label={r.rp} meta={r.meta} real={r.real} onSaveMeta={v => setGoal(selectedMonth, r.rp, v)} />
          ))}
          {repMetaRows.length === 0 && (
            <div style={{ fontSize: 12, color: '#ACA79E' }}>Aún no hay leads con RP asignado este mes.</div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#948F86' }}>Leads totales</div>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>{totalLeads}</div>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#948F86' }}>% Lead → Tour</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#18181B' }}>{totalTour}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: tierColor(pct(totalTour, totalLeads)) }}>{pct(totalTour, totalLeads)}%</span>
          </div>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#948F86' }}>% Tour → Alta</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#18181B' }}>{totalVenta}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: tierColor(pct(totalVenta, totalTour)) }}>{pct(totalVenta, totalTour)}%</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#18181B' }}>Seguimiento de leads</div>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ background: '#18181B', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          {showForm ? 'Cerrar' : '+ Nuevo lead'}
        </button>
      </div>

      {showForm && <NewLeadForm onAdd={addLead} onClose={() => setShowForm(false)} reps={reps} />}

      <input
        type="text"
        placeholder="Buscar lead por nombre…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ border: '1px solid #E4E1DC', borderRadius: 8, padding: '12px 16px', fontSize: 15, fontFamily: 'inherit', color: '#2B2926' }}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button style={pillBtnStyle(tab === 'proceso')} onClick={() => setTab('proceso')}>En proceso ({enProceso.length})</button>
        <button style={pillBtnStyle(tab === 'cerrados')} onClick={() => setTab('cerrados')}>Cerrados ({cerrados.length})</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.length === 0 && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8B877F', fontSize: 14 }}>
            {tab === 'proceso' ? 'No hay leads en proceso.' : 'Aún no hay leads cerrados.'}
          </div>
        )}
        {list.map(lead => <LeadRow key={lead.id} lead={lead} updateLead={updateLead} />)}
      </div>
    </div>
  );
}
