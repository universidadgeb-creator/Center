import type { Member, MemberPatch } from '../lib/types';
import { captureRowStyle, captureToggleStyle } from '../lib/style';
import { RoleQueue } from '../components/RoleQueue';

export function CapturaSportlab({
  members,
  updateMember,
}: {
  members: Member[];
  updateMember: (id: string, patch: MemberPatch) => void;
}) {
  return (
    <RoleQueue
      title="Captura de SPORTLAB y KEEP GOING"
      subtitle="Marca la asistencia a SPORTLAB y la inscripción a KEEP GOING de cada socio."
      members={members}
      isPending={m => !m.sportlab || !m.keepgoing}
      emptyPendingMessage="Todos los socios están al día en SPORTLAB y KEEP GOING."
      renderRow={m => (
        <div key={m.id} style={captureRowStyle()}>
          <div style={{ flex: '2 1 200px', minWidth: 180 }}>
            <div style={{ fontWeight: 600, color: '#2B2926' }}>{m.name}</div>
            <div style={{ fontSize: 12, color: '#8B877F' }}>{m.member_no || 'Sin no. de socio'} · {m.rp || 'Sin RP'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => updateMember(m.id, { sportlab: !m.sportlab })}
              style={captureToggleStyle(m.sportlab)}
            >
              {m.sportlab ? '✓ SPORTLAB' : 'Marcar SPORTLAB'}
            </button>
            <button
              onClick={() => updateMember(m.id, { keepgoing: !m.keepgoing })}
              style={captureToggleStyle(m.keepgoing)}
            >
              {m.keepgoing ? '✓ KEEP GOING' : 'Marcar KEEP GOING'}
            </button>
          </div>
        </div>
      )}
    />
  );
}
