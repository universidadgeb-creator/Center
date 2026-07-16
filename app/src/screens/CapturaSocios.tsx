import { useMemo } from 'react';
import type { Lead, LeadPatch, Member, MemberPatch } from '../lib/types';
import { captureInputStyle, captureRowStyle, formatDate, pctColor } from '../lib/style';
import { isPositiveClosed } from '../lib/leadStatus';
import { RoleQueue } from '../components/RoleQueue';
import { Card, EmptyState, Eyebrow } from '../components/Card';
import { MagnitudeBar } from '../components/Chart';

const MISSING_ACCENT = '#B42318';

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
  const leadsVinculados = useMemo(() => wonLeads.filter(l => !!l.member_id).length, [wonLeads]);

  /** Socios not yet claimed by any lead — the candidates when linking from the lead side. */
  const unlinkedMembers = useMemo(() => {
    const taken = new Set(leads.map(l => l.member_id).filter((id): id is string => !!id));
    return members.filter(m => !taken.has(m.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [leads, members]);

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

  return (
    <>
      <datalist id="captura-socios-rp-suggestions">
        {reps.map(r => <option key={r} value={r} />)}
      </datalist>
      <datalist id="captura-socios-ejecutivo-suggestions">
        {ejecutivos.map(e => <option key={e} value={e} />)}
      </datalist>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 32px 0' }}>
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
            <MagnitudeBar
              label="Leads vinculados"
              count={leadsVinculados}
              total={wonLeads.length}
              hue="#1D4ED8"
              title="Leads cerrados que ya quedaron vinculados con su socio/encuesta desde este portal."
            />
          </Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            <MissingKpiCard label="Falta no. socio" missing={faltaNoSocio} total={members.length} />
            <MissingKpiCard label="Falta RP" missing={faltaRp} total={members.length} />
            <MissingKpiCard label="Falta ejecutivo" missing={faltaEjecutivo} total={members.length} />
          </div>
        </div>
      </div>

      <RoleQueue
        title="Captura de socio y RP"
        subtitle="Verifica el RP de venta y asigna ejecutivo y número de socio a cada nuevo registro del formulario."
        members={members}
        tabs={[
          { key: 'no-socio', label: 'Falta no socio', filter: m => !m.member_no, emptyMessage: 'Todos los socios tienen número de socio asignado.' },
          { key: 'rp', label: 'Falta RP', filter: m => !m.rp, emptyMessage: 'Todos los socios tienen RP asignado.' },
          { key: 'ejecutivo', label: 'Falta Ejecutivo', filter: m => !m.ejecutivo, emptyMessage: 'Todos los socios tienen ejecutivo asignado.' },
        ]}
        renderRow={m => (
          <div key={m.id} style={captureRowStyle()}>
            <div style={{ flex: '2 1 200px', minWidth: 180 }}>
              <div style={{ fontWeight: 600, color: '#2B2926' }}>{m.name}</div>
              <div style={{ fontSize: 12, color: '#8B877F' }}>Alta: {formatDate(m.alta_date)}</div>
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
            <select
              defaultValue=""
              onChange={e => { if (e.target.value) linkLead(m.id, e.target.value); }}
              style={captureInputStyle()}
            >
              <option value="">Vincular con lead ganado…</option>
              {unlinkedWonLeads.map(l => (
                <option key={l.id} value={l.id}>{l.nombre} · {l.rp || 'Sin RP'}</option>
              ))}
            </select>
          </div>
        )}
      />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#18181B' }}>Leads cerrados sin encuesta</div>
          <div style={{ fontSize: 13, color: '#8B877F', marginTop: 4 }}>
            Ventas cerradas que aún no están vinculadas a un socio del Concentrado. O no contestaron la encuesta, o su socio ya existe y falta vincularlo aquí.
          </div>
        </div>

        {unlinkedWonLeads.length === 0 ? (
          <EmptyState>Todos los leads cerrados están vinculados a su encuesta.</EmptyState>
        ) : (
          unlinkedWonLeads.map(l => (
            <div key={l.id} style={captureRowStyle()}>
              <div style={{ flex: '2 1 200px', minWidth: 180 }}>
                <div style={{ fontWeight: 600, color: '#2B2926' }}>{l.nombre}</div>
                <div style={{ fontSize: 12, color: '#8B877F' }}>
                  {l.rp || 'Sin RP'} · Cierre: {formatDate(l.fecha_cierre)}
                </div>
              </div>
              <div style={{ flex: '1 1 140px', fontSize: 12, color: '#8B877F' }}>{l.telefono || 'Sin teléfono'}</div>
              <select
                defaultValue=""
                onChange={e => { if (e.target.value) linkLead(e.target.value, l.id); }}
                style={captureInputStyle()}
              >
                <option value="">Vincular con socio…</option>
                {unlinkedMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}{m.member_no ? ` · ${m.member_no}` : ''}</option>
                ))}
              </select>
            </div>
          ))
        )}
      </div>
    </>
  );
}
