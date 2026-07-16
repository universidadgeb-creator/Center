import { useMemo, useState } from 'react';
import type { Lead, LeadPatch, Member, MemberPatch } from '../lib/types';
import { captureInputStyle, captureRowStyle, collapseBtnStyle, formatDate, pctColor } from '../lib/style';
import { isPositiveClosed } from '../lib/leadStatus';
import { RoleQueue } from '../components/RoleQueue';
import { Card, EmptyState, Eyebrow } from '../components/Card';
import { MagnitudeBar } from '../components/Chart';

const MISSING_ACCENT = '#B42318';
const SUGGEST_HUE = '#1E7A42';

/**
 * Socio phones come from the Google Form intake and lead phones from the RP's tracker, so the
 * same number shows up as "33 1234 5678", "+52 33 1234 5678", "013312345678"… Comparing the
 * last 10 digits ignores lada/country-code/format noise. Anything shorter is too weak to match
 * on, so it yields no suggestion rather than a wrong one.
 */
function phoneKey(raw: string | null): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : null;
}

/** Like KpiBarCard, but colored by how many are *filled in* (count/total inverted) — a high
 * "falta X" count should read as a warning, not tierColor's usual "high % is good" green. */
function MissingKpiCard({ label, missing, total }: { label: string; missing: number; total: number }) {
  const filled = total - missing;
  const barColor = pctColor(filled, total);
  const pct = total ? Math.round((missing / total) * 100) : 0;
  return (
    <Card title={`${label}: socios sin este dato asignado.`} style={{ borderLeft: `4px solid ${MISSING_ACCENT}`, background: `${MISSING_ACCENT}0D` }}>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 600, color: '#18181B' }}>{missing}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: barColor }}>{total ? `${pct}%` : '—'} · de {total}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: '#EEEBE5', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: barColor, width: `${pct}%` }} />
      </div>
    </Card>
  );
}

export function CapturaSocios({
  members,
  updateMember,
  leads,
  updateLead,
}: {
  members: Member[];
  updateMember: (id: string, patch: MemberPatch) => void;
  leads: Lead[];
  updateLead: (id: string, patch: LeadPatch) => void;
}) {
  const reps = useMemo(
    () => Array.from(new Set(members.map(m => m.rp).filter((r): r is string => !!r))).sort(),
    [members]
  );

  const ejecutivos = useMemo(
    () => Array.from(new Set(members.map(m => m.ejecutivo).filter((e): e is string => !!e))).sort(),
    [members]
  );

  /** "Leads cerrados" here means the same thing it does in Concentrado de Leads: cerrados
   * positivos (100% Venta). That's the denominator every indicator on this screen scores against. */
  const wonLeads = useMemo(() => leads.filter(l => isPositiveClosed(l.status)), [leads]);

  const unlinkedWonLeads = useMemo(
    () => wonLeads.filter(l => !l.member_id).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [wonLeads]
  );

  /** Every socio in Concentrado de Socios exists because they answered the encuesta — so the
   * encuesta count is simply the socio count, not the (still barely populated) lead↔socio link. */
  const totalEncuestas = members.length;

  /** Once a lead links to a member, it drops out of unlinkedWonLeads — so the row's <select>
   * loses that <option> and the browser falls back to the placeholder, on refresh (React
   * reconciles the option list right away). That reads as "it didn't save" even though it did.
   * This map lets the row show a persistent "✓ Vinculado" instead of a select that resets itself.
   * Kept as a list, not a single lead: nothing stops two lead rows (e.g. a duplicate capture)
   * from pointing at the same socio, and hiding the second one would make it uncorrectable. */
  const linkedLeadsByMember = useMemo(() => {
    const map = new Map<string, Lead[]>();
    for (const l of leads) {
      if (!l.member_id) continue;
      const bucket = map.get(l.member_id);
      if (bucket) bucket.push(l);
      else map.set(l.member_id, [l]);
    }
    return map;
  }, [leads]);

  /** Unlinked won leads indexed by phone, so each socio row can surface its likely lead. A key
   * can hold several leads (duplicate captures of the same prospect), so this stays a list —
   * the suggestion is shown for confirmation, never auto-applied. */
  const leadsByPhone = useMemo(() => {
    const map = new Map<string, Lead[]>();
    for (const l of unlinkedWonLeads) {
      const key = phoneKey(l.telefono);
      if (!key) continue;
      const bucket = map.get(key);
      if (bucket) bucket.push(l);
      else map.set(key, [l]);
    }
    return map;
  }, [unlinkedWonLeads]);

  /** Socios not yet claimed by any lead — the other half of the phone match, surfaced on the
   * "sin encuesta" table below. That table is read-only on purpose (see its comment), so this
   * is a suggestion to go act on from the socio row above, never a link control of its own. */
  const unlinkedMembers = useMemo(() => {
    const taken = new Set(leads.map(l => l.member_id).filter((id): id is string => !!id));
    return members.filter(m => !taken.has(m.id));
  }, [leads, members]);

  const membersByPhone = useMemo(() => {
    const map = new Map<string, Member[]>();
    for (const m of unlinkedMembers) {
      const key = phoneKey(m.phone);
      if (!key) continue;
      const bucket = map.get(key);
      if (bucket) bucket.push(m);
      else map.set(key, [m]);
    }
    return map;
  }, [unlinkedMembers]);

  const [showSinEncuesta, setShowSinEncuesta] = useState(true);

  const faltaNoSocio = useMemo(() => members.filter(m => !m.member_no).length, [members]);
  const faltaRp = useMemo(() => members.filter(m => !m.rp).length, [members]);
  const faltaEjecutivo = useMemo(() => members.filter(m => !m.ejecutivo).length, [members]);

  const linkLead = (memberId: string, leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    updateLead(lead.id, { member_id: memberId });
    const patch: MemberPatch = {};
    if (lead.rp) patch.rp = lead.rp;
    if (lead.app_downloaded) patch.app_downloaded = true;
    if (Object.keys(patch).length > 0) updateMember(memberId, patch);
  };

  /** Escape hatch for a bad link (wrong lead picked, or a duplicate lead row claimed the same
   * socio twice) — the socio row otherwise has no way back once linked. */
  const unlinkLead = (leadId: string) => {
    updateLead(leadId, { member_id: null });
  };

  return (
    <>
      <datalist id="captura-socios-rp-suggestions">
        {reps.map(r => <option key={r} value={r} />)}
      </datalist>
      <datalist id="captura-socios-ejecutivo-suggestions">
        {ejecutivos.map(e => <option key={e} value={e} />)}
      </datalist>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 32px 0' }}>
        <Eyebrow>Indicadores rápidos</Eyebrow>
        {/* Two explicit rows instead of one auto-fit grid: the leads card is twice as wide as a
            "falta" card, so letting all four flow together orphaned a card on its own row. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
          <Card gap={12}>
            <Eyebrow>Leads cerrados</Eyebrow>
            <div style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>{wonLeads.length}</div>
            <MagnitudeBar
              label="Con encuesta"
              count={totalEncuestas}
              total={wonLeads.length}
              hue="#1E7A42"
              title="Socios registrados en el Concentrado de Socios — cada uno existe porque contestó la encuesta. Comparado contra los leads cerrados."
            />
          </Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            <MissingKpiCard label="Falta no. socio" missing={faltaNoSocio} total={members.length} />
            <MissingKpiCard label="Falta RP" missing={faltaRp} total={members.length} />
            <MissingKpiCard label="Falta ejecutivo" missing={faltaEjecutivo} total={members.length} />
            <MissingKpiCard label="Falta vinculado" missing={unlinkedWonLeads.length} total={wonLeads.length} />
          </div>
        </div>
      </div>

      {/* auto-fit + minmax instead of a fixed 1fr/1fr: below ~840px (2×420) it drops to one
          column automatically, so the two tables don't get crushed on a narrow screen. */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, alignItems: 'start' }}>
      <RoleQueue
        title="Captura de socio y RP"
        subtitle="Verifica el RP de venta y asigna ejecutivo y número de socio a cada nuevo registro del formulario."
        members={members}
        tabs={[
          { key: 'no-socio', label: 'Falta no socio', filter: m => !m.member_no, emptyMessage: 'Todos los socios tienen número de socio asignado.' },
          { key: 'rp', label: 'Falta RP', filter: m => !m.rp, emptyMessage: 'Todos los socios tienen RP asignado.' },
          { key: 'ejecutivo', label: 'Falta Ejecutivo', filter: m => !m.ejecutivo, emptyMessage: 'Todos los socios tienen ejecutivo asignado.' },
          { key: 'vinculado', label: 'Falta vinculado', filter: m => !linkedLeadsByMember.has(m.id), emptyMessage: 'Todos los socios ya están vinculados a su lead.' },
        ]}
        collapsible
        renderRow={m => {
          const linkedLeads = linkedLeadsByMember.get(m.id) ?? [];
          const key = phoneKey(m.phone);
          const suggested = linkedLeads.length === 0 && key ? leadsByPhone.get(key) ?? [] : [];
          return (
          <div key={m.id} style={captureRowStyle()}>
            <div style={{ flex: '2 1 200px', minWidth: 180 }}>
              <div style={{ fontWeight: 600, color: '#2B2926' }}>{m.name}</div>
              <div style={{ fontSize: 12, color: '#8B877F' }}>Alta: {formatDate(m.alta_date)}</div>
              {linkedLeads.length > 1 ? (
                <div style={{ fontSize: 11, fontWeight: 600, color: MISSING_ACCENT, marginTop: 2 }}>
                  ⚠ Vinculado a {linkedLeads.length} leads: {linkedLeads.map(l => l.nombre).join(' · ')}
                </div>
              ) : linkedLeads.length === 1 ? (
                <div style={{ fontSize: 11, fontWeight: 600, color: SUGGEST_HUE, marginTop: 2 }}>
                  ✓ Vinculado con lead: {linkedLeads[0].nombre}
                </div>
              ) : suggested.length > 0 && (
                <div style={{ fontSize: 11, fontWeight: 600, color: SUGGEST_HUE, marginTop: 2 }}>
                  ★ Mismo teléfono: {suggested.map(s => s.nombre).join(' · ')}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="No. de socio"
              defaultValue={m.member_no ?? ''}
              onBlur={e => { if (e.target.value !== (m.member_no ?? '')) updateMember(m.id, { member_no: e.target.value || null }); }}
              style={captureInputStyle()}
            />
            <input
              type="text"
              list="captura-socios-rp-suggestions"
              placeholder="RP (venta)"
              defaultValue={m.rp ?? ''}
              onBlur={e => { if (e.target.value !== (m.rp ?? '')) updateMember(m.id, { rp: e.target.value || null }); }}
              style={captureInputStyle()}
            />
            <input
              type="text"
              list="captura-socios-ejecutivo-suggestions"
              placeholder="Ejecutivo asignado"
              defaultValue={m.ejecutivo ?? ''}
              onBlur={e => { if (e.target.value !== (m.ejecutivo ?? '')) updateMember(m.id, { ejecutivo: e.target.value || null }); }}
              style={captureInputStyle()}
            />
            {linkedLeads.length > 0 ? (
              // Static on purpose — once linked, the lead drops out of the <select>'s own option
              // list, so a select here would silently reset to the placeholder and look unsaved.
              // "Desvincular" is the escape hatch for a wrong pick or a duplicate lead row — each
              // linked lead gets its own, since a socio can end up with more than one.
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
                {linkedLeads.map(l => (
                  <div key={l.id} style={{ ...captureInputStyle(), padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#EFFAF1', border: '1px solid #B7E4C7', color: SUGGEST_HUE, fontWeight: 600, fontSize: 12 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ {l.nombre}</span>
                    <button
                      onClick={() => unlinkLead(l.id)}
                      title={`Desvincular de "${l.nombre}"`}
                      style={{ background: 'none', border: 'none', color: SUGGEST_HUE, fontSize: 11, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit', padding: 0, flex: 'none' }}
                    >
                      Desvincular
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <select
                defaultValue=""
                onChange={e => { if (e.target.value) linkLead(m.id, e.target.value); }}
                style={{ ...captureInputStyle(), ...(suggested.length > 0 ? { borderColor: SUGGEST_HUE } : undefined) }}
              >
                <option value="">Vincular con lead ganado…</option>
                {suggested.length > 0 && (
                  <optgroup label="Mismo teléfono">
                    {suggested.map(l => (
                      <option key={l.id} value={l.id}>{l.nombre} · {l.rp || 'Sin RP'}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Todos los leads ganados">
                  {unlinkedWonLeads.map(l => (
                    <option key={l.id} value={l.id}>{l.nombre} · {l.rp || 'Sin RP'}</option>
                  ))}
                </optgroup>
              </select>
            )}
          </div>
          );
        }}
      />

      {/* Read-only on purpose: vincular siempre se hace desde la fila del socio (izquierda), donde
          está la sugerencia por teléfono. Esta tabla solo expone quién falta. */}
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>Leads cerrados sin encuesta</div>
            <div style={{ fontSize: 13, color: '#8B877F', marginTop: 4 }}>
              Ventas cerradas que aún no están vinculadas a un socio del Concentrado. O no contestaron la encuesta, o su socio ya existe y falta vincularlo desde la captura de la izquierda.
            </div>
          </div>
          <button style={collapseBtnStyle()} onClick={() => setShowSinEncuesta(v => !v)}>
            {showSinEncuesta ? 'Ocultar' : `Mostrar (${unlinkedWonLeads.length})`}
          </button>
        </div>

        {showSinEncuesta && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {unlinkedWonLeads.length === 0 ? (
              <EmptyState>Todos los leads cerrados están vinculados a su encuesta.</EmptyState>
            ) : (
              unlinkedWonLeads.map(l => {
                const key = phoneKey(l.telefono);
                const suggested = key ? membersByPhone.get(key) ?? [] : [];
                return (
                  <div key={l.id} style={captureRowStyle()}>
                    <div style={{ flex: '2 1 200px', minWidth: 180 }}>
                      <div style={{ fontWeight: 600, color: '#2B2926' }}>{l.nombre}</div>
                      <div style={{ fontSize: 12, color: '#8B877F' }}>
                        {l.rp || 'Sin RP'} · Cierre: {formatDate(l.fecha_cierre)}
                      </div>
                      {suggested.length > 0 && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: SUGGEST_HUE, marginTop: 2 }}>
                          ★ Posible socio (mismo teléfono): {suggested.map(s => s.name).join(' · ')} — vincula desde su fila a la izquierda
                        </div>
                      )}
                    </div>
                    <div style={{ flex: '1 1 140px', fontSize: 12, color: '#8B877F' }}>{l.telefono || 'Sin teléfono'}</div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
