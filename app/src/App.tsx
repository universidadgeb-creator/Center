import { useState } from 'react';
import { TopNav } from './components/TopNav';
import { Home } from './screens/Home';
import { VistaSocio } from './screens/VistaSocio';
import { VistaRp } from './screens/VistaRp';
import { Concentrado } from './screens/Concentrado';
import { CapturaSocios } from './screens/CapturaSocios';
import { CapturaSportlab } from './screens/CapturaSportlab';
import { ConcentradoLeads } from './screens/ConcentradoLeads';
import { useMembers } from './hooks/useMembers';
import { useLeads } from './hooks/useLeads';
import { useLeadGoals } from './hooks/useLeadGoals';

export type Screen = 'home' | 'perfil' | 'rpdash' | 'lider' | 'capturaSocios' | 'capturaSportlab' | 'leads';

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { members, loading, error, updateMember } = useMembers();
  const { leads, loading: leadsLoading, error: leadsError, addLead, updateLead } = useLeads();
  const { goals, setGoal } = useLeadGoals();

  const goToPerfil = (memberId: string) => {
    setSelectedMemberId(memberId);
    setScreen('perfil');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF9' }}>
      <TopNav screen={screen} onChange={setScreen} />

      {(screen === 'leads' ? leadsError : error) && (
        <div style={{ maxWidth: 1180, margin: '16px auto 0', padding: '0 32px' }}>
          <div style={{ background: '#FBEAEA', border: '1px solid #F4CCCA', color: '#B42318', borderRadius: 8, padding: '12px 16px', fontSize: 13 }}>
            Error cargando datos: {screen === 'leads' ? leadsError : error}
          </div>
        </div>
      )}

      {screen === 'home' && (
        <Home onNavigate={setScreen} />
      )}

      {screen === 'leads' && (
        leadsLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#8B877F', fontSize: 14 }}>Cargando…</div>
        ) : (
          <ConcentradoLeads leads={leads} goals={goals} addLead={addLead} updateLead={updateLead} setGoal={setGoal} />
        )
      )}

      {screen !== 'home' && screen !== 'leads' && (loading ? (
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
            <Concentrado members={members} onViewProfile={goToPerfil} />
          )}
          {screen === 'capturaSocios' && (
            <CapturaSocios members={members} updateMember={updateMember} leads={leads} updateLead={updateLead} />
          )}
          {screen === 'capturaSportlab' && (
            <CapturaSportlab members={members} updateMember={updateMember} />
          )}
        </>
      ))}
    </div>
  );
}

export default App;
