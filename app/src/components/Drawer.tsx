import type { ReactNode } from 'react';

/** Generic right-side slide-over — used for a row's full detail, without reordering the table
 * behind it (an inline-expanding row would push every row below it down instead). */
export function Drawer({ open, onClose, title, subtitle, children }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(24,24,27,0.32)' }} />
      <div style={{ position: 'relative', width: 440, maxWidth: '92vw', height: '100%', background: '#FFFFFF', boxShadow: '-12px 0 32px rgba(0,0,0,0.16)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #E4E1DC', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#18181B' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: '#8B877F', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ background: 'none', border: 'none', fontSize: 22, color: '#8B877F', cursor: 'pointer', lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 22, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function DrawerField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#948F86' }}>{label}</div>
      {/* Plain block wrapper, not a flex item: inputs reuse captureInputStyle() (built for
       * horizontal filter bars), whose `flex: 1 1 160px` would otherwise apply along this
       * column's main axis and stretch each field to fill the drawer's height. */}
      <div>{children}</div>
    </div>
  );
}
