import { tabBtnStyle } from '../lib/style';
import type { Screen } from '../App';

type Portal = 'leads' | 'socios' | 'admin' | 'deportes';

const PORTAL_OF: Partial<Record<Screen, Portal>> = {
  leadsPizarra: 'leads',
  lider: 'socios',
  capturaSocios: 'admin',
  capturaSportlab: 'deportes',
};

const PORTAL_LABEL: Record<Portal, string> = {
  leads: 'Concentrado · Leads',
  socios: 'Concentrado · Socios',
  admin: 'Portal Admin',
  deportes: 'Portal Deportes',
};

const PORTAL_TABS: Record<Portal, { screen: Screen; label: string }[]> = {
  leads: [],
  socios: [],
  admin: [
    { screen: 'capturaSocios', label: 'Captura Socios' },
  ],
  deportes: [
    { screen: 'capturaSportlab', label: 'Captura Sportlab' },
  ],
};

export function TopNav({ screen, onChange }: { screen: Screen; onChange: (s: Screen) => void }) {
  const portal = PORTAL_OF[screen];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        padding: '10px 32px',
        minHeight: 64,
        background: '#FFFFFF',
        borderBottom: '1px solid #E4E1DC',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        flexWrap: 'wrap',
        rowGap: 10,
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 170, cursor: 'pointer' }}
        onClick={() => onChange('home')}
      >
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.03em', color: '#18181B' }}>VIVO47</span>
        <span style={{ fontSize: 13, color: '#8B877F' }}>{portal ? PORTAL_LABEL[portal] : 'Portal operativo'}</span>
      </div>
      {portal && PORTAL_TABS[portal].length > 1 && (
        <div style={{ display: 'flex', gap: 4, background: '#F4F2ED', padding: 4, borderRadius: 9, flexWrap: 'wrap' }}>
          {PORTAL_TABS[portal].map(tab => (
            <button key={tab.screen} style={tabBtnStyle(screen === tab.screen)} onClick={() => onChange(tab.screen)}>
              {tab.label}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 170, justifyContent: 'flex-end' }}>
        <div
          style={{
            width: 32, height: 32, borderRadius: 999, background: '#EFEDE9',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: '#57534E', flex: 'none',
          }}
        >
          OP
        </div>
      </div>
    </div>
  );
}
