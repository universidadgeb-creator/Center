import { tabBtnStyle } from '../lib/style';
import type { Screen } from '../App';

export function TopNav({ screen, onChange }: { screen: Screen; onChange: (s: Screen) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        padding: '0 32px',
        height: 64,
        background: '#FFFFFF',
        borderBottom: '1px solid #E4E1DC',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 170 }}>
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.03em', color: '#18181B' }}>VIVO47</span>
        <span style={{ fontSize: 13, color: '#8B877F' }}>Portal operativo</span>
      </div>
      <div style={{ display: 'flex', gap: 4, background: '#F4F2ED', padding: 4, borderRadius: 9 }}>
        <button style={tabBtnStyle(screen === 'lider')} onClick={() => onChange('lider')}>Concentrado</button>
        <button style={tabBtnStyle(screen === 'rpdash')} onClick={() => onChange('rpdash')}>Vista RP</button>
        <button style={tabBtnStyle(screen === 'perfil')} onClick={() => onChange('perfil')}>Vista Socio</button>
      </div>
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
