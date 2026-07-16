import type { Screen } from '../App';
import { color } from '../lib/tokens';

type CardVariant = 'black' | 'green' | 'white';

const VARIANT_STYLE: Record<CardVariant, { background: string; color: string; border: string; descColor: string }> = {
  black: { background: color.accentInk, color: '#FFFFFF', border: 'none', descColor: '#B7B5BD' },
  green: { background: color.accent, color: color.accentInk, border: 'none', descColor: '#3D4A2A' },
  white: { background: '#FFFFFF', color: color.accentInk, border: `2px solid ${color.accentInk}`, descColor: '#57534E' },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: color.accentInk,
        color: color.accent,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        padding: '7px 16px',
        borderRadius: 999,
      }}
    >
      {children}
    </span>
  );
}

function HomeCard({ label, description, variant, onClick }: { label: string; description: string; variant: CardVariant; onClick: () => void }) {
  const v = VARIANT_STYLE[variant];
  return (
    <button
      onClick={onClick}
      style={{
        background: v.background,
        border: v.border,
        borderRadius: 20,
        padding: 26,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit',
        flex: '1 1 240px',
        minWidth: 220,
      }}
    >
      <span style={{ fontSize: 18, fontWeight: 700, color: v.color }}>{label}</span>
      <span style={{ fontSize: 13, color: v.descColor, lineHeight: 1.5 }}>{description}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: v.color, marginTop: 8 }}>Entrar →</span>
    </button>
  );
}

function HomeColumn({ label, title, subtitle, children }: { label: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>{label}</SectionLabel>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: color.accentInk }}>{title}</div>
        <div style={{ fontSize: 13, color: '#57534E', marginTop: 4 }}>{subtitle}</div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

export function Home({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 32px 72px', display: 'flex', flexDirection: 'column', gap: 56 }}>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <HomeColumn label="Leads" title="Prospectos" subtitle="Antes de la venta.">
          <HomeCard
            label="Concentrado de leads"
            description="Metas por RP, embudo lead → tour → alta, y seguimiento de cada lead."
            variant="black"
            onClick={() => onNavigate('leadsPizarra')}
          />
        </HomeColumn>

        <HomeColumn label="Socios" title="Post-venta" subtitle="Ya convertidos.">
          <HomeCard
            label="Concentrado de socios"
            description="Indicadores generales, filtros por mes y panel de socios."
            variant="green"
            onClick={() => onNavigate('lider')}
          />
        </HomeColumn>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <SectionLabel>Entrada de datos</SectionLabel>
        <div style={{ fontSize: 20, fontWeight: 800, color: color.accentInk }}>Captura operativa</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <HomeCard
            label="Portal Admin"
            description="Asigna número de socio y RP; vincula leads ganados."
            variant="white"
            onClick={() => onNavigate('capturaSocios')}
          />
          <HomeCard
            label="Portal Deportes"
            description="Marca SPORTLAB, KEEP GOING y Performance Day."
            variant="black"
            onClick={() => onNavigate('capturaSportlab')}
          />
        </div>
      </div>

    </div>
  );
}
