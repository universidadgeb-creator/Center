import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Member } from '../lib/types';
import { collapseBtnStyle } from '../lib/style';
import { EmptyState } from './Card';

export interface RoleQueueTab {
  key: string;
  label: string;
  filter: (m: Member) => boolean;
  emptyMessage?: string;
  /** Optional content shown above the row list only while this tab is active — e.g. a bulk
   * action banner for a "suggestions" tab. */
  banner?: ReactNode;
}

function segmentBtnStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    background: active ? '#18181B' : '#F4F2ED',
    color: active ? '#FFFFFF' : '#57534E',
  };
}

function countBadgeStyle(active: boolean): CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 700,
    padding: '1px 8px',
    borderRadius: 999,
    background: active ? 'rgba(255,255,255,0.18)' : '#E4E1DC',
    color: active ? '#FFFFFF' : '#57534E',
  };
}

export function RoleQueue({
  title,
  subtitle,
  members,
  isPending,
  renderRow,
  emptyPendingMessage = 'No hay pendientes. Todo al día.',
  tabs,
  collapsible = false,
}: {
  title: string;
  subtitle: string;
  members: Member[];
  /** Ignored when `tabs` is provided — kept for the default Pendientes/Completos split. */
  isPending?: (m: Member) => boolean;
  renderRow: (m: Member) => ReactNode;
  emptyPendingMessage?: string;
  /** Custom tab set (e.g. one tab per missing field) — replaces the default Pendientes/Completos split. */
  tabs?: RoleQueueTab[];
  /** Adds an Ocultar/Mostrar toggle so a long queue can be folded away. */
  collapsible?: boolean;
}) {
  const resolvedTabs = useMemo<RoleQueueTab[]>(() => tabs ?? [
    { key: 'pendientes', label: 'Pendientes', filter: isPending!, emptyMessage: emptyPendingMessage },
    { key: 'completos', label: 'Completos', filter: m => !isPending!(m), emptyMessage: 'Aún no hay socios completos.' },
  ], [tabs, isPending, emptyPendingMessage]);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(resolvedTabs[0].key);
  const [open, setOpen] = useState(true);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m => m.name.toLowerCase().includes(q));
  }, [members, search]);

  const activeTab = resolvedTabs.find(t => t.key === tab) ?? resolvedTabs[0];
  const list = searched.filter(activeTab.filter);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>{title}</div>
          <div style={{ fontSize: 13, color: '#8B877F', marginTop: 4 }}>{subtitle}</div>
        </div>
        {collapsible && (
          <button style={collapseBtnStyle()} onClick={() => setOpen(o => !o)}>
            {open ? 'Ocultar' : `Mostrar (${members.length})`}
          </button>
        )}
      </div>

      {open && (
        <>
          <input
            type="text"
            placeholder="Buscar socio por nombre…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: '1px solid #E4E1DC', borderRadius: 8, padding: '12px 16px', fontSize: 15, fontFamily: 'inherit', color: '#2B2926' }}
          />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {resolvedTabs.map(t => (
              <button key={t.key} style={segmentBtnStyle(tab === t.key)} onClick={() => setTab(t.key)}>
                {t.label} <span style={countBadgeStyle(tab === t.key)}>{searched.filter(t.filter).length}</span>
              </button>
            ))}
          </div>

          {activeTab.banner}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {list.length === 0 && (
              <EmptyState>{activeTab.emptyMessage ?? 'No hay resultados.'}</EmptyState>
            )}
            {list.map(m => renderRow(m))}
          </div>
        </>
      )}
    </div>
  );
}
