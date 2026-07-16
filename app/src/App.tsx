import { useEffect, useRef, useState } from 'react';
import { TopNav } from './components/TopNav';
import { ToastStack } from './components/Toast';
import { Home } from './screens/Home';
import { VistaSocio } from './screens/VistaSocio';
import { VistaEjecutivo } from './screens/VistaEjecutivo';
import { Concentrado } from './screens/Concentrado';
import { CapturaSocios } from './screens/CapturaSocios';
import { CapturaSportlab } from './screens/CapturaSportlab';
import { LeadsSeguimientoRp } from './screens/LeadsSeguimientoRp';
import { LeadsPizarra } from './screens/LeadsPizarra';
import { useMembers } from './hooks/useMembers';
import { useLeads } from './hooks/useLeads';
import { useLeadGoals } from './hooks/useLeadGoals';
import { useRps } from './hooks/useRps';
import { usePromotions } from './hooks/usePromotions';
import { useToast } from './hooks/useToast';
import { friendlyError } from './lib/errors';

export type Screen = 'home' | 'perfil' | 'rpdash' | 'lider' | 'capturaSocios' | 'capturaSportlab' | 'leadsPizarra' | 'leadsSeguimientoRp';

/** Fires a toast the moment any of these error strings goes from null to non-null — so a
 * failed save is noticed immediately near the interaction, not just in a banner that may be
 * scrolled out of view. */
function useErrorToasts(push: (message: string) => void, ...errors: (string | null)[]) {
  const prev = useRef<(string | null)[]>(errors.map(() => null));
  useEffect(() => {
    errors.forEach((err, i) => {
      if (err && err !== prev.current[i]) push(friendlyError(err));
      prev.current[i] = err;
    });
  }, [push, ...errors]);
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { members, loading, error, updateMember } = useMembers();
  const { leads, loading: leadsLoading, error: leadsError, addLead, addLeads, updateLead, deleteLead, deleteLeads } = useLeads();
  const { goals, error: goalsError, setGoal } = useLeadGoals();
  const { rps, addRp } = useRps();
  const { promotions, addPromotion } = usePromotions();
  const { toasts, push, dismiss } = useToast();

  useErrorToasts(push, error, leadsError, goalsError);

  const goToPerfil = (memberId: string) => {
    setSelectedMemberId(memberId);
    setScreen('perfil');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF9' }}>
      <TopNav screen={screen} onChange={setScreen} />
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      {(screen === 'leadsPizarra' || screen === 'leadsSeguimientoRp' ? leadsError : error) && (
        <div style={{ maxWidth: 1180, margin: '16px auto 0', padding: '0 32px' }}>
          <div style={{ background: '#FBEAEA', border: '1px solid #F4CCCA', color: '#B42318', borderRadius: 8, padding: '12px 16px', fontSize: 13 }}>
            {friendlyError(screen === 'leadsPizarra' || screen === 'leadsSeguimientoRp' ? leadsError : error)}
          </div>
        </div>
      )}

      {screen === 'home' && (
        <Home onNavigate={setScreen} />
      )}

      {screen === 'leadsSeguimientoRp' && (
        leadsLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#8B877F', fontSize: 14 }}>Cargando…</div>
        ) : (
          <LeadsSeguimientoRp leads={leads} goals={goals} setGoal={setGoal} />
        )
      )}

      {screen === 'leadsPizarra' && (
        leadsLoading || loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#8B877F', fontSize: 14 }}>Cargando…</div>
        ) : (
          <LeadsPizarra
            leads={leads}
            members={members}
            addLead={addLead}
            addLeads={addLeads}
            updateLead={updateLead}
            deleteLead={deleteLead}
            deleteLeads={deleteLeads}
            rps={rps}
            addRp={addRp}
            promotions={promotions}
            addPromotion={addPromotion}
          />
        )
      )}

      {screen !== 'home' && screen !== 'leadsPizarra' && screen !== 'leadsSeguimientoRp' && (loading ? (
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
            <VistaEjecutivo members={members} onViewProfile={goToPerfil} />
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
