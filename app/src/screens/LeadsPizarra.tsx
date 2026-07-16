import { useMemo, useRef, useState } from 'react';
import type { Lead, LeadGoal, LeadInsert, LeadPatch, Member, Promotion, Rp } from '../lib/types';
import { captureInputStyle, checkButtonStyle, checkStyle, coloredPillBtnStyle, formatDate, initialsOf, pctColor, pctLabel, pillBtnStyle, primaryButtonStyle } from '../lib/style';
import { formatMonthLabel, monthKey } from '../lib/date';
import {
  LEAD_CATEGORY_FILTERS, LEAD_ESTRATEGIAS, LEAD_STATUSES, PLAN_OPTIONS, STATUS_GROUPS,
  TIPO_ALTA_OPTIONS, computeLeadBuckets, isClosedStatus, isNegativeClosed, isPositiveClosed,
  isWonStatus, leadBucketRows, leadStatusColor, matchesLeadCategory,
} from '../lib/leadStatus';
import { NEW_PROMOTION_COLOR_CHOICES } from '../hooks/usePromotions';
import { downloadLeadsTemplate, parseLeadsWorkbook } from '../lib/leadsExcel';
import { Card, Eyebrow, EmptyState } from '../components/Card';
import { DonutChart, KpiBarCard, MagnitudeBar, StackedBar } from '../components/Chart';
import { AddOption } from '../components/AddOption';
import { Drawer, DrawerField } from '../components/Drawer';

/** Left-border accent for KPIs whose denominator is only won leads, not every lead — so the
 * different scope reads visually, not just in the fine-print note underneath. */
const WON_ONLY_ACCENT = '#7C3AED';

const cellStyle: React.CSSProperties = { padding: '6px 6px', whiteSpace: 'nowrap' };
const thStyleBase: React.CSSProperties = { padding: '8px 6px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#948F86', fontWeight: 500, borderBottom: '2px solid #191A23', whiteSpace: 'normal', lineHeight: 1.2 };
const inputCellStyle: React.CSSProperties = { ...captureInputStyle(), padding: '6px 8px', fontSize: 12, minWidth: 0, width: '100%', flex: 'none' };
const dividerStyle: React.CSSProperties = { borderLeft: '2px solid #D9D5CE' };
const today = () => new Date().toISOString().slice(0, 10);
const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const GENERAL_RP = '';

function promotionColor(promotions: Promotion[], label: string | null): string | undefined {
  return promotions.find(p => p.label === label)?.color;
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

function NewLeadForm({ onAdd, onClose, rps, addRp }: { onAdd: (lead: LeadInsert) => void; onClose: () => void; rps: Rp[]; addRp: (name: string) => void }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [estrategia, setEstrategia] = useState('');
  const [rp, setRp] = useState('');
  const [fechaAsignacion, setFechaAsignacion] = useState(today);

  const submit = () => {
    if (!nombre.trim()) return;
    onAdd({
      nombre: nombre.trim(),
      telefono: telefono.trim() || undefined,
      correo: correo.trim() || undefined,
      estrategia: estrategia || undefined,
      rp: rp || undefined,
      fecha_asignacion: fechaAsignacion || undefined,
    });
    onClose();
  };

  return (
    <Card gap={12}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#18181B' }}>Nuevo lead</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Nombre*" value={nombre} onChange={e => setNombre(e.target.value)} style={captureInputStyle()} />
        <input type="text" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} style={captureInputStyle()} />
        <input type="text" placeholder="Correo electrónico" value={correo} onChange={e => setCorreo(e.target.value)} style={captureInputStyle()} />
        <select value={estrategia} onChange={e => setEstrategia(e.target.value)} style={captureInputStyle()}>
          <option value="">Estrategia…</option>
          {LEAD_ESTRATEGIAS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={rp} onChange={e => setRp(e.target.value)} style={captureInputStyle()}>
          <option value="">RP…</option>
          {rps.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
        </select>
        <AddOption label="RP" placeholder="Nombre del RP" onAdd={addRp} />
        <input type="date" value={fechaAsignacion} onChange={e => setFechaAsignacion(e.target.value)} style={captureInputStyle()} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={submit}
          disabled={!nombre.trim()}
          style={primaryButtonStyle(!nombre.trim())}
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
    </Card>
  );
}

function LeadDetailDrawer({
  lead,
  member,
  rps,
  addRp,
  promotions,
  addPromotion,
  onClose,
  updateLead,
  deleteLead,
}: {
  lead: Lead;
  member: Member | undefined;
  rps: Rp[];
  addRp: (name: string) => void;
  promotions: Promotion[];
  addPromotion: (label: string, color: string) => void;
  onClose: () => void;
  updateLead: (id: string, patch: LeadPatch) => void;
  deleteLead: (id: string) => void;
}) {
  return (
    <Drawer open title={lead.nombre} subtitle={member?.member_no ? `Socio ${member.member_no}` : 'Aún no vinculado a un socio'} onClose={onClose}>
      <DrawerField label="Estrategia">
        <select
          value={lead.estrategia ?? ''}
          onChange={e => updateLead(lead.id, { estrategia: e.target.value || null })}
          style={captureInputStyle()}
        >
          <option value="">Sin estrategia</option>
          {LEAD_ESTRATEGIAS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </DrawerField>

      <DrawerField label="Promoción">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={lead.promocion ?? ''}
            onChange={e => updateLead(lead.id, { promocion: e.target.value || null })}
            style={{ ...captureInputStyle(), color: promotionColor(promotions, lead.promocion) ?? '#2B2926', fontWeight: 600 }}
          >
            <option value="">Sin promoción</option>
            {promotions.map(p => <option key={p.id} value={p.label} style={{ color: p.color }}>{p.label}</option>)}
          </select>
          <AddOption label="Promoción" placeholder="Nombre de la promoción" colors={NEW_PROMOTION_COLOR_CHOICES} onAdd={(label, color) => addPromotion(label, color ?? NEW_PROMOTION_COLOR_CHOICES[0])} />
        </div>
      </DrawerField>

      <DrawerField label="RP">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={lead.rp ?? ''}
            onChange={e => updateLead(lead.id, { rp: e.target.value || null })}
            style={captureInputStyle()}
          >
            <option value="">Sin asignar</option>
            {rps.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
          <AddOption label="RP" placeholder="Nombre del RP" onAdd={addRp} />
        </div>
      </DrawerField>

      <DrawerField label="Fecha de cierre">
        <input
          type="date"
          value={lead.fecha_cierre ?? ''}
          onChange={e => updateLead(lead.id, { fecha_cierre: e.target.value || null })}
          style={captureInputStyle()}
        />
      </DrawerField>

      <DrawerField label="Fecha de tour">
        <input
          type="date"
          value={lead.fecha_cita ?? ''}
          onChange={e => updateLead(lead.id, { fecha_cita: e.target.value || null })}
          style={captureInputStyle()}
        />
      </DrawerField>

      <DrawerField label="Correo electrónico">
        <input
          type="text"
          defaultValue={lead.correo ?? ''}
          onBlur={e => { if (e.target.value !== (lead.correo ?? '')) updateLead(lead.id, { correo: e.target.value || null }); }}
          style={captureInputStyle()}
        />
      </DrawerField>

      <DrawerField label="Tipo de alta">
        <select
          value={lead.tipo_alta ?? ''}
          onChange={e => updateLead(lead.id, { tipo_alta: e.target.value || null })}
          style={captureInputStyle()}
        >
          <option value="">Sin tipo</option>
          {TIPO_ALTA_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </DrawerField>

      <DrawerField label="Monto sin IVA">
        <input
          type="number"
          step="0.01"
          min={0}
          defaultValue={lead.monto_sin_iva ?? ''}
          onBlur={e => {
            const v = e.target.value === '' ? null : Number(e.target.value);
            if (v !== lead.monto_sin_iva) updateLead(lead.id, { monto_sin_iva: v });
          }}
          style={captureInputStyle()}
        />
      </DrawerField>

      <DrawerField label="Monto con IVA">
        <input
          type="number"
          step="0.01"
          min={0}
          defaultValue={lead.monto_con_iva ?? ''}
          onBlur={e => {
            const v = e.target.value === '' ? null : Number(e.target.value);
            if (v !== lead.monto_con_iva) updateLead(lead.id, { monto_con_iva: v });
          }}
          style={captureInputStyle()}
        />
      </DrawerField>

      <DrawerField label="Comentario / Notas">
        <textarea
          defaultValue={lead.comentarios ?? ''}
          onBlur={e => { if (e.target.value !== (lead.comentarios ?? '')) updateLead(lead.id, { comentarios: e.target.value || null }); }}
          style={{ ...captureInputStyle(), minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </DrawerField>

      <div style={{ borderTop: '1px solid #EEEBE5', paddingTop: 16, marginTop: 4 }}>
        <button
          onClick={() => {
            if (window.confirm(`¿Borrar el lead "${lead.nombre}"? Esta acción no se puede deshacer.`)) {
              deleteLead(lead.id);
              onClose();
            }
          }}
          style={{ background: 'none', border: '1px solid #F4CCCA', color: '#B42318', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Borrar lead
        </button>
      </div>
    </Drawer>
  );
}

function PizarraRow({
  lead,
  member,
  onOpenDetail,
  updateLead,
}: {
  lead: Lead;
  member: Member | undefined;
  onOpenDetail: () => void;
  updateLead: (id: string, patch: LeadPatch) => void;
}) {
  const isWon = isWonStatus(lead.status);
  const encuestaHecha = !!lead.member_id;
  const appDescargada = lead.member_id ? !!member?.app_downloaded : lead.app_downloaded;
  const expedienteCompleto = encuestaHecha && appDescargada;
  const needsSurvey = isWon && !lead.member_id;
  const isPendiente = lead.status === 'Nuevo';
  const na = <span style={{ color: '#C7C2B8' }}>—</span>;

  const toggleTour = () => {
    const turningOn = !lead.tour;
    updateLead(lead.id, {
      tour: turningOn,
      ...(turningOn && !lead.fecha_cita ? { fecha_cita: today() } : {}),
    });
  };

  return (
    <tr style={{ borderBottom: '1px solid #EEEBE5', background: needsSurvey ? '#FDF3DF' : isPendiente ? '#EAF1FB' : undefined }}>
      <td style={cellStyle}>{formatDate(lead.fecha_asignacion)}</td>
      <td style={{ ...cellStyle, fontWeight: 600, color: '#1D4ED8', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={onOpenDetail}>{lead.nombre}</td>
      <td style={cellStyle}>
        <input
          type="text"
          defaultValue={lead.telefono ?? ''}
          onBlur={e => { if (e.target.value !== (lead.telefono ?? '')) updateLead(lead.id, { telefono: e.target.value || null }); }}
          style={inputCellStyle}
        />
      </td>
      <td style={cellStyle}>
        <select
          value={lead.status}
          onChange={e => updateLead(lead.id, { status: e.target.value, fecha_cierre: isClosedStatus(e.target.value) ? today() : null })}
          style={{ ...inputCellStyle, color: leadStatusColor(lead.status), fontWeight: 600 }}
        >
          {LEAD_STATUSES.map(s => <option key={s} value={s} style={{ color: leadStatusColor(s) }}>{s}</option>)}
        </select>
      </td>
      <td style={cellStyle}>
        <select
          value={lead.plan ?? ''}
          onChange={e => updateLead(lead.id, { plan: e.target.value || null })}
          style={inputCellStyle}
        >
          <option value="">Sin plan</option>
          {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </td>
      <td style={{ ...cellStyle, textAlign: 'center' }}>
        <button onClick={toggleTour} style={checkButtonStyle(lead.tour)}>{lead.tour ? '✓' : '✕'}</button>
      </td>
      <td style={{ ...cellStyle, ...dividerStyle, textAlign: 'center' }}>
        {isWon ? <span style={checkStyle(expedienteCompleto)}>{expedienteCompleto ? '✓' : '✕'}</span> : na}
      </td>
      <td style={{ ...cellStyle, textAlign: 'center', fontSize: 11 }}>
        {!isWon ? na : needsSurvey ? (
          <span style={{ fontWeight: 600, color: '#92610A' }}>Falta</span>
        ) : (
          <span style={checkStyle(encuestaHecha)}>{encuestaHecha ? '✓' : '✕'}</span>
        )}
      </td>
      <td style={{ ...cellStyle, textAlign: 'center' }}>
        {!isWon ? na : lead.member_id ? (
          <span style={checkStyle(appDescargada)}>{appDescargada ? '✓' : '✕'}</span>
        ) : (
          <button onClick={() => updateLead(lead.id, { app_downloaded: !lead.app_downloaded })} style={checkButtonStyle(lead.app_downloaded)}>
            {lead.app_downloaded ? '✓' : '✕'}
          </button>
        )}
      </td>
    </tr>
  );
}

const COLUMNS: { label: string; width: number }[] = [
  { label: 'Fecha', width: 66 },
  { label: 'Nombre', width: 150 },
  { label: 'Teléfono', width: 90 },
  { label: 'Status', width: 140 },
  { label: 'Plan', width: 66 },
  { label: 'Tour', width: 44 },
  { label: 'Expediente', width: 66 },
  { label: 'Encuesta', width: 56 },
  { label: 'APP', width: 50 },
];

/** Read-only variant of the table, used once a specific RP is selected — no edit controls,
 * no detail drawer, matching the "vista de solo lectura" tradeoff for that scope. */
const RP_COLUMNS: { label: string; width: number; align: 'left' | 'center' }[] = [
  { label: 'Fecha de asignación', width: 140, align: 'left' },
  { label: 'Nombre', width: 200, align: 'left' },
  { label: 'Status', width: 160, align: 'left' },
  { label: 'Tour', width: 70, align: 'center' },
];

function RpReadOnlyRow({ lead }: { lead: Lead }) {
  return (
    <tr style={{ borderBottom: '1px solid #EEEBE5', background: lead.status === 'Nuevo' ? '#EAF1FB' : undefined }}>
      <td style={{ padding: '14px 20px', color: '#4A4640' }}>{formatDate(lead.fecha_asignacion)}</td>
      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#2B2926' }}>{lead.nombre}</td>
      <td style={{ padding: '14px 20px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: leadStatusColor(lead.status) }}>{lead.status}</span>
      </td>
      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
        <span style={checkStyle(lead.tour)}>{lead.tour ? '✓' : '✕'}</span>
      </td>
    </tr>
  );
}

export function LeadsPizarra({
  leads,
  members,
  addLead,
  addLeads,
  updateLead,
  deleteLead,
  deleteLeads,
  rps,
  addRp,
  promotions,
  addPromotion,
  goals,
  setGoal,
}: {
  leads: Lead[];
  members: Member[];
  addLead: (lead: LeadInsert) => void;
  addLeads: (leads: LeadInsert[]) => Promise<number>;
  updateLead: (id: string, patch: LeadPatch) => void;
  deleteLead: (id: string) => void;
  deleteLeads: (ids: string[]) => Promise<boolean>;
  rps: Rp[];
  addRp: (name: string) => void;
  promotions: Promotion[];
  addPromotion: (label: string, color: string) => void;
  goals: LeadGoal[];
  setGoal: (month: string, rp: string, meta_altas: number) => void;
}) {
  const memberById = useMemo(() => new Map(members.map(m => [m.id, m])), [members]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadSummary, setUploadSummary] = useState<string | null>(null);
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);
  const [showGoals, setShowGoals] = useState(false);

  // ---- Indicadores (arriba de la tabla) ----
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
  const [selectedRp, setSelectedRp] = useState('todos');
  const isGeneral = selectedRp === 'todos';

  // Month-only scope, independent of the RP selector — feeds the metas panel, which always
  // shows every RP's goal regardless of which one is currently selected.
  const monthScoped = useMemo(() => {
    if (selectedMonth === 'todos') return leads;
    return leads.filter(l => monthKey(l.fecha_asignacion) === selectedMonth);
  }, [leads, selectedMonth]);

  // Month + RP scope — feeds every indicator card, so switching the RP selector re-scopes the
  // whole dashboard instead of just the table below.
  const scoped = useMemo(() => {
    if (isGeneral) return monthScoped;
    return monthScoped.filter(l => l.rp === selectedRp);
  }, [monthScoped, isGeneral, selectedRp]);

  const allReps = useMemo(
    () => Array.from(new Set(leads.map(l => l.rp).filter((r): r is string => !!r))).sort(),
    [leads]
  );

  const totalLeads = scoped.length;
  const totalVenta = scoped.filter(l => isWonStatus(l.status)).length;
  // Tour → Alta needs every lead that ever toured, including ones that have since closed.
  const totalTourAll = scoped.filter(l => l.tour).length;

  // Lead → Tour only makes sense against leads still active in the funnel — once a lead is
  // closed (won or lost) it no longer moves through the tour stage, so counting it here would
  // understate the true conversion rate of leads still being worked.
  const tourScoped = useMemo(() => scoped.filter(l => !isPositiveClosed(l.status) && !isNegativeClosed(l.status)), [scoped]);
  const totalTour = tourScoped.filter(l => l.tour).length;

  // Expediente/encuesta/APP only ever apply once a lead has actually closed as a sale — before
  // that there's no member profile to survey or sync APP status against, so scoring them
  // against every lead (including ones still mid-funnel) made the % look artificially low.
  const wonScoped = useMemo(() => scoped.filter(l => isWonStatus(l.status)), [scoped]);
  const wonWithFlags = useMemo(
    () => wonScoped.map(l => {
      const member = l.member_id ? memberById.get(l.member_id) : undefined;
      const encuestaHecha = !!l.member_id;
      const appDescargada = l.member_id ? !!member?.app_downloaded : l.app_downloaded;
      return { encuestaHecha, appDescargada, expedienteCompleto: encuestaHecha && appDescargada };
    }),
    [wonScoped, memberById]
  );
  const totalEncuesta = wonWithFlags.filter(f => f.encuestaHecha).length;
  const totalApp = wonWithFlags.filter(f => f.appDescargada).length;
  const totalExpediente = wonWithFlags.filter(f => f.expedienteCompleto).length;

  const buckets = useMemo(() => computeLeadBuckets(scoped), [scoped]);

  const statusDist = LEAD_STATUSES
    .map(s => ({ label: s, count: scoped.filter(l => l.status === s).length, color: leadStatusColor(s) }))
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);

  const statusGroupDist = STATUS_GROUPS
    .map(g => ({ label: g.label, color: g.color, count: scoped.filter(l => g.statuses.includes(l.status)).length }))
    .filter(g => g.count > 0)
    .sort((a, b) => b.count - a.count);

  const estrategiaDist = LEAD_ESTRATEGIAS
    .map(e => ({ label: e, count: scoped.filter(l => l.estrategia === e).length }))
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count);

  // Once a specific RP is selected, `scoped` is already limited to that RP — collapse the
  // breakdown to their single row instead of iterating every rep (who'd otherwise show 0).
  const cierreReps = isGeneral ? allReps : [selectedRp];
  const rpCierre = cierreReps.map(rp => {
    const rpLeads = scoped.filter(l => l.rp === rp);
    const positivos = rpLeads.filter(l => isPositiveClosed(l.status)).length;
    const negativos = rpLeads.filter(l => isNegativeClosed(l.status)).length;
    const pendientes = rpLeads.length - positivos - negativos;
    const pct = rpLeads.length ? Math.round((positivos / rpLeads.length) * 100) : 0;
    return { rp, total: rpLeads.length, positivos, negativos, pendientes, pct };
  });

  // RP-only figures — meaningless aggregated across every rep, so only shown once one is
  // selected (see montoVendido/ticketPromedio/diasCierre cards below).
  const montoTotal = wonScoped.reduce((sum, l) => sum + (l.monto_con_iva ?? 0), 0);
  const ticketPromedio = wonScoped.length ? montoTotal / wonScoped.length : 0;
  const diasCierre = wonScoped
    .filter(l => l.fecha_cierre)
    .map(l => (new Date(l.fecha_cierre!).getTime() - new Date(l.fecha_asignacion!).getTime()) / 86400000)
    .filter(d => Number.isFinite(d) && d >= 0);
  const promedioDiasCierre = diasCierre.length ? diasCierre.reduce((a, b) => a + b, 0) / diasCierre.length : null;

  const goalsByRp = useMemo(() => {
    const map = new Map<string, number>();
    goals.filter(g => g.month === selectedMonth).forEach(g => map.set(g.rp, g.meta_altas));
    return map;
  }, [goals, selectedMonth]);
  const repMetaRows = allReps.map(rp => ({
    rp,
    meta: goalsByRp.get(rp) ?? 0,
    real: monthScoped.filter(l => l.rp === rp && isWonStatus(l.status)).length,
  }));
  const generalMeta = goalsByRp.get(GENERAL_RP) ?? 0;
  const generalReal = monthScoped.filter(l => isWonStatus(l.status)).length;

  const handleFile = async (file: File) => {
    setUploadSummary('Importando…');
    const { leads: parsed, skipped, total } = await parseLeadsWorkbook(file);
    const inserted = await addLeads(parsed);
    const skippedNote = skipped > 0 ? ` (${skipped} fila${skipped === 1 ? '' : 's'} sin nombre, omitida${skipped === 1 ? '' : 's'})` : '';
    setUploadSummary(`Se importaron ${inserted} de ${total} filas${skippedNote}.`);
  };

  const handleDeleteAll = async () => {
    if (leads.length === 0) return;
    const confirmed = window.confirm(
      `¿Borrar los ${leads.length} leads del Concentrado? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;
    const ok = await deleteLeads(leads.map(l => l.id));
    setUploadSummary(ok ? `Se borraron ${leads.length} leads.` : 'No se pudieron borrar los leads.');
  };

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<typeof LEAD_CATEGORY_FILTERS[number]['key']>('todos');
  const [showForm, setShowForm] = useState(false);
  const [encuestaOnly, setEncuestaOnly] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);

  const baseFiltered = useMemo(() => {
    let rows = leads;
    if (!isGeneral) rows = rows.filter(l => l.rp === selectedRp);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter(l => l.nombre.toLowerCase().includes(q));
    return rows;
  }, [leads, isGeneral, selectedRp, search]);

  const filtered = useMemo(() => baseFiltered
    .filter(l => matchesLeadCategory(l.status, categoryFilter))
    .filter(l => !encuestaOnly || (isWonStatus(l.status) && !l.member_id)),
    [baseFiltered, categoryFilter, encuestaOnly]
  );

  const detailLead = detailLeadId ? leads.find(l => l.id === detailLeadId) : undefined;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>Concentrado · Leads</div>
          <div style={{ fontSize: 13, color: '#8B877F', marginTop: 4 }}>
            {isGeneral ? 'Tablero de seguimiento editable — clic en el nombre para ver el detalle completo.' : `Vista de solo lectura para ${selectedRp}.`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowGoals(s => !s)}
            style={{ background: 'none', border: '1px solid #D9D5CE', padding: '10px 16px', borderRadius: 8, fontSize: 13, color: '#2B2926', cursor: 'pointer' }}
          >
            {showGoals ? 'Cerrar metas' : 'Definir metas'}
          </button>
          {isGeneral && (
            <>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUploadMenu(v => !v)}
                  style={{ background: 'none', border: '1px solid #D9D5CE', padding: '10px 16px', borderRadius: 8, fontSize: 13, color: '#2B2926', cursor: 'pointer' }}
                >
                  Carga masiva ▾
                </button>
                {showUploadMenu && (
                  <div style={{ position: 'absolute', top: '110%', left: 0, background: '#fff', border: '1px solid #E4E1DC', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 10, minWidth: 180, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <button
                      onClick={() => { downloadLeadsTemplate(); setShowUploadMenu(false); }}
                      style={{ background: 'none', border: 'none', textAlign: 'left', padding: '10px 14px', fontSize: 13, color: '#2B2926', cursor: 'pointer' }}
                    >
                      Descargar plantilla
                    </button>
                    <button
                      onClick={() => { fileInputRef.current?.click(); setShowUploadMenu(false); }}
                      style={{ background: 'none', border: 'none', textAlign: 'left', padding: '10px 14px', fontSize: 13, color: '#2B2926', cursor: 'pointer', borderTop: '1px solid #EEEBE5' }}
                    >
                      Subir archivo
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => setShowForm(s => !s)}
                style={primaryButtonStyle()}
              >
                {showForm ? 'Cerrar' : '+ Nuevo lead'}
              </button>
              <button
                onClick={handleDeleteAll}
                style={{ background: 'none', border: '1px solid #F4CCCA', color: '#B42318', padding: '10px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
              >
                Borrar todos
              </button>
            </>
          )}
        </div>
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        <select
          value={selectedRp}
          onChange={e => setSelectedRp(e.target.value)}
          style={{ border: '1px solid #E4E1DC', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: 'inherit', color: '#2B2926', background: '#fff' }}
        >
          <option value="todos">General (todos los RP)</option>
          {allReps.map(rp => (
            <option key={rp} value={rp}>{rp}</option>
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

      {!isGeneral && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: '#B9FF66', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#191A23', flex: 'none' }}>
            {initialsOf(selectedRp)}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#18181B' }}>{selectedRp}</div>
            <div style={{ fontSize: 13, color: '#8B877F' }}>{totalLeads} leads asignados{selectedMonth !== 'todos' ? ` · ${formatMonthLabel(selectedMonth)}` : ''}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <Card gap={12} style={{ gridColumn: 'span 2' }}>
          <Eyebrow>Leads totales</Eyebrow>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>{totalLeads}</div>
          {leadBucketRows(buckets).map(r => (
            <MagnitudeBar key={r.key} label={r.label} count={r.count} total={buckets.total} hue={r.hue} title={r.title} />
          ))}
        </Card>
        <Card gap={10}>
          <Eyebrow>Lead → Tour → Alta</Eyebrow>
          <MagnitudeBar label="Lead → Tour" count={totalTour} total={tourScoped.length} title="Leads que agendaron tour, sin contar los ya cerrados (positivos o negativos)." />
          <MagnitudeBar label="Tour → Alta" count={totalVenta} total={totalTourAll} title="De los leads con tour, cuántos terminaron en venta cerrada." />
        </Card>
        <KpiBarCard label="Expedientes completos" count={totalExpediente} total={wonScoped.length} accent={WON_ONLY_ACCENT} title="Leads con venta cerrada que ya tienen encuesta contestada y APP descargada. Solo aplica a leads con 100% Venta." />
        <KpiBarCard label="Con APP" count={totalApp} total={wonScoped.length} accent={WON_ONLY_ACCENT} title="Leads con venta cerrada que ya descargaron la app. Solo aplica a leads con 100% Venta." />
        <KpiBarCard label="Con encuesta" count={totalEncuesta} total={wonScoped.length} accent={WON_ONLY_ACCENT} title="Leads con venta cerrada que ya contestaron la encuesta y quedaron vinculados a un socio. Solo aplica a leads con 100% Venta." />
      </div>

      {!isGeneral && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          <Card>
            <Eyebrow>Monto vendido</Eyebrow>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>{currency.format(montoTotal)}</div>
          </Card>
          <Card>
            <Eyebrow>Ticket promedio</Eyebrow>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>{wonScoped.length ? currency.format(ticketPromedio) : '—'}</div>
          </Card>
          <Card>
            <Eyebrow>Días promedio a cierre</Eyebrow>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>{promedioDiasCierre !== null ? Math.round(promedioDiasCierre) : '—'}</div>
          </Card>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <Card gap={12}>
          <Eyebrow>Resumen de status (agrupado)</Eyebrow>
          {statusGroupDist.length > 0 ? (
            <DonutChart slices={statusGroupDist.map(g => ({ label: g.label, count: g.count, color: g.color }))} />
          ) : (
            <div style={{ fontSize: 12, color: '#ACA79E' }}>Sin leads en este periodo.</div>
          )}
          <div style={{ borderTop: '1px solid #EEEBE5', paddingTop: 12, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Eyebrow>{isGeneral ? '% de cierre por RP' : '% de cierre'}</Eyebrow>
            {rpCierre.map(r => (
              <div key={r.rp} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ fontWeight: 600, color: '#2B2926' }}>{r.rp}</span>
                  <span style={{ fontWeight: 700, color: pctColor(r.positivos, r.total) }}>{r.pct}% cierre</span>
                </div>
                <StackedBar height={12} segments={[
                  { label: 'Cerrados positivos', count: r.positivos, color: '#1E7A42' },
                  { label: 'Cerrados negativos', count: r.negativos, color: '#B42318' },
                  { label: 'Pendientes', count: r.pendientes, color: '#C7C2B8' },
                ]} />
              </div>
            ))}
            {rpCierre.length === 0 && <div style={{ fontSize: 12, color: '#ACA79E' }}>Aún no hay leads con RP asignado.</div>}
          </div>
        </Card>

        <Card gap={10}>
          <Eyebrow>Distribución por status (detalle)</Eyebrow>
          {statusDist.map(s => <MagnitudeBar key={s.label} label={s.label} count={s.count} total={totalLeads} hue={s.color} />)}
          {statusDist.length === 0 && <div style={{ fontSize: 12, color: '#ACA79E' }}>Sin leads en este periodo.</div>}
        </Card>

        <Card gap={10}>
          <Eyebrow>Distribución por estrategia</Eyebrow>
          {estrategiaDist.map(e => <MagnitudeBar key={e.label} label={e.label} count={e.count} total={totalLeads} />)}
          {estrategiaDist.length === 0 && <div style={{ fontSize: 12, color: '#ACA79E' }}>Sin leads con estrategia registrada.</div>}
        </Card>
      </div>

      {uploadSummary && (
        <Card style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 13, color: '#57534E' }}>{uploadSummary}</div>
        </Card>
      )}

      {isGeneral && showForm && <NewLeadForm onAdd={addLead} onClose={() => setShowForm(false)} rps={rps} addRp={addRp} />}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar lead por nombre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, border: '1px solid #E4E1DC', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: '#2B2926' }}
        />
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

      {filtered.length === 0 ? (
        <EmptyState>No hay leads que coincidan con este filtro.</EmptyState>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E4E1DC', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            {isGeneral ? (
              <table className="data-table" style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  {COLUMNS.map(c => <col key={c.label} style={{ width: c.width }} />)}
                </colgroup>
                <thead>
                  <tr style={{ background: '#FAFAF9' }}>
                    {COLUMNS.map(c => (
                      <th key={c.label} style={{ ...thStyleBase, ...(c.label === 'Expediente' ? dividerStyle : undefined), textAlign: 'left' }}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => (
                    <PizarraRow
                      key={lead.id}
                      lead={lead}
                      member={lead.member_id ? memberById.get(lead.member_id) : undefined}
                      onOpenDetail={() => setDetailLeadId(lead.id)}
                      updateLead={updateLead}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="data-table" style={{ width: '100%', fontSize: 13, tableLayout: 'fixed' }}>
                <colgroup>
                  {RP_COLUMNS.map(c => <col key={c.label} style={{ width: c.width }} />)}
                </colgroup>
                <thead>
                  <tr style={{ background: '#FAFAF9' }}>
                    {RP_COLUMNS.map(c => (
                      <th key={c.label} style={{ textAlign: c.align, padding: '12px 20px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#948F86', fontWeight: 500, borderBottom: '2px solid #191A23' }}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => <RpReadOnlyRow key={lead.id} lead={lead} />)}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid #E4E1DC', fontSize: 13, color: '#8B877F' }}>
            <span>Mostrando {filtered.length} de {baseFiltered.length} leads</span>
          </div>
        </div>
      )}

      {isGeneral && detailLead && (
        <LeadDetailDrawer
          lead={detailLead}
          member={detailLead.member_id ? memberById.get(detailLead.member_id) : undefined}
          rps={rps}
          addRp={addRp}
          promotions={promotions}
          addPromotion={addPromotion}
          onClose={() => setDetailLeadId(null)}
          updateLead={updateLead}
          deleteLead={deleteLead}
        />
      )}

    </div>
  );
}
