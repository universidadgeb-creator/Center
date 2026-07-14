import type { Screen } from '../App';

function HomeCard({ label, description, onClick }: { label: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E4E1DC',
        borderRadius: 10,
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit',
        flex: '1 1 220px',
        minWidth: 200,
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: '#18181B' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#8B877F', lineHeight: 1.4 }}>{description}</span>
    </button>
  );
}

function HomeColumn({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#18181B' }}>{title}</div>
        <div style={{ fontSize: 13, color: '#8B877F', marginTop: 2 }}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function HomeSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#18181B' }}>{title}</div>
        <div style={{ fontSize: 13, color: '#8B877F', marginTop: 2 }}>{description}</div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

export function Home({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '56px 32px', display: 'flex', flexDirection: 'column', gap: 48 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#18181B' }}>VIVO47 — Portal operativo</div>
        <div style={{ fontSize: 14, color: '#8B877F', marginTop: 8 }}>Elige el panel que corresponde a tu rol.</div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <HomeColumn title="Leads" subtitle="Prospectos antes de la venta.">
          <HomeCard
            label="Concentrado"
            description="Metas por RP, embudo lead → tour → alta, y seguimiento de cada lead."
            onClick={() => onNavigate('leads')}
          />
        </HomeColumn>

        <HomeColumn title="Socios" subtitle="Ya convertidos, post-venta.">
          <HomeCard
            label="Concentrado"
            description="Indicadores generales, filtros por mes y panel de socios."
            onClick={() => onNavigate('lider')}
          />
        </HomeColumn>
      </div>

      <HomeSection title="Entrada de datos" description="Captura operativa directa, un panel a la vez.">
        <HomeCard label="Portal Admin" description="Asigna número de socio y RP; vincula leads ganados." onClick={() => onNavigate('capturaSocios')} />
        <HomeCard label="Portal Deportes" description="Marca SPORTLAB y KEEP GOING." onClick={() => onNavigate('capturaSportlab')} />
      </HomeSection>
    </div>
  );
}
