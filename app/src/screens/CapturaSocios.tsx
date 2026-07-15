import { useMemo } from 'react';
import type { Lead, LeadPatch, Member, MemberPatch } from '../lib/types';
import { captureInputStyle, captureRowStyle, formatDate } from '../lib/style';
import { isWonStatus } from '../lib/leadStatus';
import { RoleQueue } from '../components/RoleQueue';

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

  const unlinkedWonLeads = useMemo(
    () => leads.filter(l => isWonStatus(l.status) && !l.member_id).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [leads]
  );

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
      <RoleQueue
        title="Captura de socio y RP"
        subtitle="Verifica el RP de venta y asigna ejecutivo y número de socio a cada nuevo registro del formulario."
        members={members}
        isPending={m => !m.member_no || !m.rp || !m.ejecutivo}
        emptyPendingMessage="Todos los socios tienen número, RP y ejecutivo asignado."
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
    </>
  );
}
