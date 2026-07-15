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
      title="Captura de SPORTLAB, KEEP GOING y Performance Day"
      subtitle="Marca la asistencia a SPORTLAB, la inscripción a KEEP GOING y Performance Day de cada socio."
      members={members}
      isPending={m => !m.sportlab || !m.keepgoing || !m.performance_day}
      emptyPendingMessage="Todos los socios están al día en SPORTLAB, KEEP GOING y Performance Day."
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
            <button
              onClick={() => updateMember(m.id, { performance_day: !m.performance_day })}
              style={captureToggleStyle(m.performance_day)}
            >
              {m.performance_day ? '✓ Performance Day' : 'Marcar Performance Day'}
            </button>
          </div>
        </div>
      )}
    />
  );
}
