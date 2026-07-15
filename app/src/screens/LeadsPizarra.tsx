import { useMemo, useRef, useState } from 'react';
import type { Lead, LeadGoal, LeadInsert, LeadPatch, Member, Promotion, Rp } from '../lib/types';
import { captureInputStyle, checkButtonStyle, checkStyle, formatDate, pctColor, pctLabel, pillBtnStyle, primaryButtonStyle } from '../lib/style';
import { formatMonthLabel, monthKey } from '../lib/date';
import { LEAD_ESTRATEGIAS, LEAD_STATUSES, PLAN_OPTIONS, TIPO_ALTA_OPTIONS, isClosedStatus, isWonStatus, leadStatusColor } from '../lib/leadStatus';
import { NEW_PROMOTION_COLOR_CHOICES } from '../hooks/usePromotions';
import { downloadLeadsTemplate, parseLeadsWorkbook } from '../lib/leadsExcel';
import { Card, Eyebrow, EmptyState } from '../components/Card';
import { MagnitudeBar } from '../components/Chart';
import { AddOption } from '../components/AddOption';
import { Drawer, DrawerField } from '../components/Drawer';

const GENERAL_RP = '';

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

/** Compact label+count+pct row with a colored identity dot — used for distributions with too
 * many categories (status has 15, estrategia has 11) to read well as a chart. */
function DistributionRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: color, flex: 'none' }} />
      <span style={{ color: '#6E6A64', flex: 1 }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#2B2926' }}>{count} · {pctLabel(count, total)}</span>
    </div>
  );
}

const cellStyle: React.CSSProperties = { padding: '10px 12px', whiteSpace: 'nowrap' };
const inputCellStyle: React.CSSProperties = { ...captureInputStyle(), minWidth: 130, flex: 'none' };
const today = () => new Date().toISOString().slice(0, 10);

function promotionColor(promotions: Promotion[], label: string | null): string | undefined {
  return promotions.find(p => p.label === label)?.color;
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
}: {
  lead: Lead;
  member: Member | undefined;
  rps: Rp[];
  addRp: (name: string) => void;
  promotions: Promotion[];
  addPromotion: (label: string, color: string) => void;
  onClose: () => void;
  updateLead: (id: string, patch: LeadPatch) => void;
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
  const encuestaHecha = !!lead.member_id;
  const appDescargada = lead.member_id ? !!member?.app_downloaded : lead.app_downloaded;
  const expedienteCompleto = encuestaHecha && appDescargada;
  const needsSurvey = isWonStatus(lead.status) && !lead.member_id;

  const toggleTour = () => {
    const turningOn = !lead.tour;
    updateLead(lead.id, {
      tour: turningOn,
      ...(turningOn && !lead.fecha_cita ? { fecha_cita: today() } : {}),
    });
  };

  return (
    <tr style={{ borderBottom: '1px solid #EEEBE5', background: needsSurvey ? '#FDF3DF' : undefined }}>
      <td style={cellStyle}>{formatDate(lead.fecha_asignacion)}</td>
      <td style={{ ...cellStyle, fontWeight: 600, color: '#1D4ED8', cursor: 'pointer' }} onClick={onOpenDetail}>{lead.nombre}</td>
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
          style={{ ...inputCellStyle, minWidth: 210, color: leadStatusColor(lead.status), fontWeight: 600 }}
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
      <td style={{ ...cellStyle, textAlign: 'center' }}>
        <span style={checkStyle(expedienteCompleto)}>{expedienteCompleto ? '✓' : '✕'}</span>
      </td>
      <td style={{ ...cellStyle, textAlign: 'center' }}>
        {needsSurvey ? (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#92610A' }}>Falta encuesta</span>
        ) : (
          <span style={checkStyle(encuestaHecha)}>{encuestaHecha ? '✓' : '✕'}</span>
        )}
      </td>
      <td style={{ ...cellStyle, textAlign: 'center' }}>
        {lead.member_id ? (
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

const HEADERS = ['Fecha de asignación', 'Nombre', 'Teléfono', 'Status', 'Plan', 'Tour', 'Expediente completo', 'Encuesta hecha', 'APP descargada'];

export function LeadsPizarra({
  leads,
  members,
  goals,
  setGoal,
  addLead,
  addLeads,
  updateLead,
  rps,
  addRp,
  promotions,
  addPromotion,
}: {
  leads: Lead[];
  members: Member[];
  goals: LeadGoal[];
  setGoal: (month: string, rp: string, meta_altas: number) => void;
  addLead: (lead: LeadInsert) => void;
  addLeads: (leads: LeadInsert[]) => Promise<number>;
  updateLead: (id: string, patch: LeadPatch) => void;
  rps: Rp[];
  addRp: (name: string) => void;
  promotions: Promotion[];
  addPromotion: (label: string, color: string) => void;
}) {
  const memberById = useMemo(() => new Map(members.map(m => [m.id, m])), [members]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadSummary, setUploadSummary] = useState<string | null>(null);
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);

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

  const scoped = useMemo(() => {
    if (selectedMonth === 'todos') return leads;
    return leads.filter(l => monthKey(l.fecha_asignacion) === selectedMonth);
  }, [leads, selectedMonth]);

  const allReps = useMemo(
    () => Array.from(new Set(leads.map(l => l.rp).filter((r): r is string => !!r))).sort(),
    [leads]
  );

  const totalLeads = scoped.length;
  const totalTour = scoped.filter(l => l.tour).length;
  const totalVenta = scoped.filter(l => isWonStatus(l.status)).length;

  const scopedWithFlags = useMemo(
    () => scoped.map(l => {
      const member = l.member_id ? memberById.get(l.member_id) : undefined;
      const encuestaHecha = !!l.member_id;
      const appDescargada = l.member_id ? !!member?.app_downloaded : l.app_downloaded;
      return { encuestaHecha, appDescargada, expedienteCompleto: encuestaHecha && appDescargada };
    }),
    [scoped, memberById]
  );
  const totalEncuesta = scopedWithFlags.filter(f => f.encuestaHecha).length;
  const totalApp = scopedWithFlags.filter(f => f.appDescargada).length;
  const totalExpediente = scopedWithFlags.filter(f => f.expedienteCompleto).length;

  const goalsByRp = useMemo(() => {
    const map = new Map<string, number>();
    goals.filter(g => g.month === selectedMonth).forEach(g => map.set(g.rp, g.meta_altas));
    return map;
  }, [goals, selectedMonth]);

  const repMetaRows = allReps.map(rp => ({
    rp,
    meta: goalsByRp.get(rp) ?? 0,
    real: scoped.filter(l => l.rp === rp && isWonStatus(l.status)).length,
  }));
  const generalMeta = goalsByRp.get(GENERAL_RP) ?? 0;

  const statusDist = LEAD_STATUSES
    .map(s => ({ label: s, count: scoped.filter(l => l.status === s).length, color: leadStatusColor(s) }))
    .filter(s => s.count > 0);

  const estrategiaDist = LEAD_ESTRATEGIAS
    .map(e => ({ label: e, count: scoped.filter(l => l.estrategia === e).length }))
    .filter(e => e.count > 0);

  const rpCierre = allReps.map(rp => {
    const rpLeads = scoped.filter(l => l.rp === rp);
    const won = rpLeads.filter(l => isWonStatus(l.status)).length;
    return { rp, total: rpLeads.length, won };
  });

  const handleFile = async (file: File) => {
    setUploadSummary('Importando…');
    const { leads: parsed, skipped, total } = await parseLeadsWorkbook(file);
    const inserted = await addLeads(parsed);
    const skippedNote = skipped > 0 ? ` (${skipped} fila${skipped === 1 ? '' : 's'} sin nombre, omitida${skipped === 1 ? '' : 's'})` : '';
    setUploadSummary(`Se importaron ${inserted} de ${total} filas${skippedNote}.`);
  };

  const [search, setSearch] = useState('');
  const [rpFilter, setRpFilter] = useState('todos');
  const [tab, setTab] = useState<'proceso' | 'cerrados'>('proceso');
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    let rows = leads;
    if (rpFilter !== 'todos') rows = rows.filter(l => l.rp === rpFilter);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter(l => l.nombre.toLowerCase().includes(q));
    return rows;
  }, [leads, rpFilter, search]);

  const enProceso = filtered.filter(l => !isClosedStatus(l.status));
  const cerrados = filtered.filter(l => isClosedStatus(l.status));
  const list = tab === 'proceso' ? enProceso : cerrados;

  const detailLead = detailLeadId ? leads.find(l => l.id === detailLeadId) : undefined;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>Concentrado · Leads</div>
          <div style={{ fontSize: 13, color: '#8B877F', marginTop: 4 }}>Tablero de seguimiento editable — clic en el nombre para ver el detalle completo.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={downloadLeadsTemplate}
            style={{ background: 'none', border: '1px solid #D9D5CE', padding: '10px 16px', borderRadius: 8, fontSize: 13, color: '#2B2926', cursor: 'pointer' }}
          >
            Descargar plantilla
          </button>
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
            onClick={() => fileInputRef.current?.click()}
            style={{ background: 'none', border: '1px solid #D9D5CE', padding: '10px 16px', borderRadius: 8, fontSize: 13, color: '#2B2926', cursor: 'pointer' }}
          >
            Subir archivo
          </button>
          <button
            onClick={() => setShowForm(s => !s)}
            style={primaryButtonStyle()}
          >
            {showForm ? 'Cerrar' : '+ Nuevo lead'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
        <Card style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 13, color: '#8B877F' }}>Selecciona un mes específico para definir y ver metas por RP.</div>
        </Card>
      ) : (
        <Card gap={14}>
          <Eyebrow>Metas de altas · {formatMonthLabel(selectedMonth)}</Eyebrow>
          <MetaRow label="General" meta={generalMeta} real={totalVenta} onSaveMeta={v => setGoal(selectedMonth, GENERAL_RP, v)} />
          {repMetaRows.map(r => (
            <MetaRow key={r.rp} label={r.rp} meta={r.meta} real={r.real} onSaveMeta={v => setGoal(selectedMonth, r.rp, v)} />
          ))}
          {repMetaRows.length === 0 && (
            <div style={{ fontSize: 12, color: '#ACA79E' }}>Aún no hay leads con RP asignado este mes.</div>
          )}
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        <Card>
          <Eyebrow>Leads totales</Eyebrow>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>{totalLeads}</div>
        </Card>
        <Card>
          <Eyebrow>% Lead → Tour</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#18181B' }}>{totalTour}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: pctColor(totalTour, totalLeads) }}>{pctLabel(totalTour, totalLeads)}</span>
          </div>
        </Card>
        <Card>
          <Eyebrow>% Tour → Alta</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#18181B' }}>{totalVenta}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: pctColor(totalVenta, totalTour) }}>{pctLabel(totalVenta, totalTour)}</span>
          </div>
        </Card>
        <Card>
          <Eyebrow>Expedientes completos</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#18181B' }}>{totalExpediente}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: pctColor(totalExpediente, totalLeads) }}>de {totalLeads}</span>
          </div>
        </Card>
        <Card>
          <Eyebrow>Con APP</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#18181B' }}>{totalApp}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: pctColor(totalApp, totalLeads) }}>de {totalLeads}</span>
          </div>
        </Card>
        <Card>
          <Eyebrow>Con encuesta</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#18181B' }}>{totalEncuesta}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: pctColor(totalEncuesta, totalLeads) }}>de {totalLeads}</span>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <Card gap={10}>
          <Eyebrow>Distribución por status</Eyebrow>
          {statusDist.map(s => <DistributionRow key={s.label} label={s.label} count={s.count} total={totalLeads} color={s.color} />)}
          {statusDist.length === 0 && <div style={{ fontSize: 12, color: '#ACA79E' }}>Sin leads en este periodo.</div>}
        </Card>

        <Card gap={10}>
          <Eyebrow>Distribución por estrategia</Eyebrow>
          {estrategiaDist.map(e => <DistributionRow key={e.label} label={e.label} count={e.count} total={totalLeads} color="#57534E" />)}
          {estrategiaDist.length === 0 && <div style={{ fontSize: 12, color: '#ACA79E' }}>Sin leads con estrategia registrada.</div>}
        </Card>

        <Card gap={10}>
          <Eyebrow>% de cierre por RP</Eyebrow>
          {rpCierre.map(r => <MagnitudeBar key={r.rp} label={r.rp} count={r.won} total={r.total} />)}
          {rpCierre.length === 0 && <div style={{ fontSize: 12, color: '#ACA79E' }}>Aún no hay leads con RP asignado.</div>}
        </Card>
      </div>

      {uploadSummary && (
        <Card style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 13, color: '#57534E' }}>{uploadSummary}</div>
        </Card>
      )}

      {showForm && <NewLeadForm onAdd={addLead} onClose={() => setShowForm(false)} rps={rps} addRp={addRp} />}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar lead por nombre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, border: '1px solid #E4E1DC', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: '#2B2926' }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={pillBtnStyle(rpFilter === 'todos')} onClick={() => setRpFilter('todos')}>Todos</button>
          {rps.map(r => (
            <button key={r.id} style={pillBtnStyle(rpFilter === r.name)} onClick={() => setRpFilter(r.name)}>{r.name}</button>
          ))}
        </div>
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
            <table className="data-table" style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAF9' }}>
                  {HEADERS.map(h => (
                    <th key={h} style={{ ...cellStyle, textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#948F86', fontWeight: 500, borderBottom: '2px solid #191A23' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(lead => (
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
          </div>
          <div style={{ padding: '14px 20px', borderTop: '1px solid #E4E1DC', fontSize: 13, color: '#8B877F' }}>
            <span>Mostrando {list.length} de {filtered.length} leads</span>
          </div>
        </div>
      )}

      {detailLead && (
        <LeadDetailDrawer
          lead={detailLead}
          member={detailLead.member_id ? memberById.get(detailLead.member_id) : undefined}
          rps={rps}
          addRp={addRp}
          promotions={promotions}
          addPromotion={addPromotion}
          onClose={() => setDetailLeadId(null)}
          updateLead={updateLead}
        />
      )}

    </div>
  );
}
