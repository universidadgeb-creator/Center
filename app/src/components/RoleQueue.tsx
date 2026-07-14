import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Member } from '../lib/types';

type Tab = 'pendientes' | 'completos';

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
}: {
  title: string;
  subtitle: string;
  members: Member[];
  isPending: (m: Member) => boolean;
  renderRow: (m: Member) => ReactNode;
  emptyPendingMessage?: string;
}) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('pendientes');

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m => m.name.toLowerCase().includes(q));
  }, [members, search]);

  const pending = searched.filter(isPending);
  const done = searched.filter(m => !isPending(m));
  const list = tab === 'pendientes' ? pending : done;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>{title}</div>
        <div style={{ fontSize: 13, color: '#8B877F', marginTop: 4 }}>{subtitle}</div>
      </div>

      <input
        type="text"
        placeholder="Buscar socio por nombre…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ border: '1px solid #E4E1DC', borderRadius: 8, padding: '12px 16px', fontSize: 15, fontFamily: 'inherit', color: '#2B2926' }}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <button style={segmentBtnStyle(tab === 'pendientes')} onClick={() => setTab('pendientes')}>
          Pendientes <span style={countBadgeStyle(tab === 'pendientes')}>{pending.length}</span>
        </button>
        <button style={segmentBtnStyle(tab === 'completos')} onClick={() => setTab('completos')}>
          Completos <span style={countBadgeStyle(tab === 'completos')}>{done.length}</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.length === 0 && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8B877F', fontSize: 14 }}>
            {tab === 'pendientes' ? emptyPendingMessage : 'Aún no hay socios completos.'}
          </div>
        )}
        {list.map(m => renderRow(m))}
      </div>
    </div>
  );
}
