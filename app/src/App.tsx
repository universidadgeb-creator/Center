import { useState } from 'react';
import { TopNav } from './components/TopNav';
import { VistaSocio } from './screens/VistaSocio';
import { VistaRp } from './screens/VistaRp';
import { Concentrado } from './screens/Concentrado';
import { useMembers } from './hooks/useMembers';

export type Screen = 'perfil' | 'rpdash' | 'lider';

function App() {
  const [screen, setScreen] = useState<Screen>('lider');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { members, loading, error, updateMember } = useMembers();

  const goToPerfil = (memberId: string) => {
    setSelectedMemberId(memberId);
    setScreen('perfil');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF9' }}>
      <TopNav screen={screen} onChange={setScreen} />

      {error && (
        <div style={{ maxWidth: 1180, margin: '16px auto 0', padding: '0 32px' }}>
          <div style={{ background: '#FBEAEA', border: '1px solid #F4CCCA', color: '#B42318', borderRadius: 8, padding: '12px 16px', fontSize: 13 }}>
            Error cargando datos: {error}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#8B877F', fontSize: 14 }}>Cargando…</div>
      ) : (
        <>
          {screen === 'perfil' && (
            <VistaSocio
              members={members}
              selectedMemberId={selectedMemberId}
              onSelectMember={setSelectedMemberId}
            />
          )}
          {screen === 'rpdash' && (
            <VistaRp members={members} onViewProfile={goToPerfil} />
          )}
          {screen === 'lider' && (
            <Concentrado members={members} onViewProfile={goToPerfil} updateMember={updateMember} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
