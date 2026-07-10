import { useMemo, useState } from 'react';
import type { Member, MemberPatch } from '../lib/types';
import { checkButtonStyle, formatDate, initialsOf, pillBtnStyle, riskBadgeStyle, sortHeaderStyle, tierColor } from '../lib/style';

type SortKey = 'name' | 'rp' | 'app' | 'sportlab' | 'keepgoing' | 'risk' | 'altaDate';
type SortDir = 'asc' | 'desc';

const RISK_ORDER: Record<string, number> = { Alto: 0, Medio: 1, Bajo: 2 };

const COLUMNS: { key: SortKey; label: string; align: 'left' | 'center' }[] = [
  { key: 'name', label: 'Socio', align: 'left' },
  { key: 'rp', label: 'RP asignado', align: 'left' },
  { key: 'app', label: 'APP', align: 'center' },
  { key: 'sportlab', label: 'SPORTLAB', align: 'center' },
  { key: 'keepgoing', label: 'KEEP GOING', align: 'center' },
  { key: 'risk', label: 'Riesgo', align: 'left' },
  { key: 'altaDate', label: 'Fecha de alta', align: 'left' },
];

function sortMembers(rows: Member[], key: SortKey, dir: SortDir): Member[] {
  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    if (key === 'name') cmp = a.name.localeCompare(b.name);
    else if (key === 'rp') cmp = (a.rp || '').localeCompare(b.rp || '');
    else if (key === 'app') cmp = (b.app_downloaded ? 1 : 0) - (a.app_downloaded ? 1 : 0);
    else if (key === 'sportlab') cmp = (b.sportlab ? 1 : 0) - (a.sportlab ? 1 : 0);
    else if (key === 'keepgoing') cmp = (b.keepgoing ? 1 : 0) - (a.keepgoing ? 1 : 0);
    else if (key === 'risk') cmp = (RISK_ORDER[a.risk ?? ''] ?? 3) - (RISK_ORDER[b.risk ?? ''] ?? 3);
    else if (key === 'altaDate') cmp = (a.alta_date || '').localeCompare(b.alta_date || '');
    if (cmp === 0) cmp = a.name.localeCompare(b.name);
    return dir === 'desc' ? -cmp : cmp;
  });
  return sorted;
}

export function Concentrado({
  members,
  onViewProfile,
  updateMember,
}: {
  members: Member[];
  onViewProfile: (id: string) => void;
  updateMember: (id: string, patch: MemberPatch) => void;
}) {
  const reps = useMemo(
    () => Array.from(new Set(members.map(m => m.rp).filter((r): r is string => !!r))).sort(),
    [members]
  );

  const [search, setSearch] = useState('');
  const [rpFilter, setRpFilter] = useState<string>('todos');
  const [quickFilter, setQuickFilter] = useState<'ninguno' | 'riesgoalto' | 'sinkeepgoing'>('ninguno');
  const [sortKey, setSortKey] = useState<SortKey>('risk');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const totalAll = members.length;
  const kpiG = (count: number) => {
    const pct = totalAll ? Math.round((count / totalAll) * 100) : 0;
    return { count, pct, pctLabel: `${pct}%`, color: tierColor(pct) };
  };
  const riesgoAltoCount = members.filter(m => m.risk === 'Alto').length;
  const kpis = {
    app: kpiG(members.filter(m => m.app_downloaded).length),
    sportlab: kpiG(members.filter(m => m.sportlab).length),
    keepgoing: kpiG(members.filter(m => m.keepgoing).length),
    riesgoAlto: { count: riesgoAltoCount, pctLabel: `${totalAll ? Math.round((riesgoAltoCount / totalAll) * 100) : 0}%` },
  };

  const perRep = reps.map(name => {
    const list = members.filter(m => m.rp === name);
    const n = list.length;
    const pctOf = (count: number) => (n ? Math.round((count / n) * 100) : 0);
    const appPct = pctOf(list.filter(m => m.app_downloaded).length);
    const sportlabPct = pctOf(list.filter(m => m.sportlab).length);
    const keepgoingPct = pctOf(list.filter(m => m.keepgoing).length);
    return { name, count: n, appPct, sportlabPct, keepgoingPct };
  });

  let filtered = members;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(m => m.name.toLowerCase().includes(q));
  }
  if (rpFilter !== 'todos') filtered = filtered.filter(m => m.rp === rpFilter);
  if (quickFilter === 'riesgoalto') filtered = filtered.filter(m => m.risk === 'Alto');
  if (quickFilter === 'sinkeepgoing') filtered = filtered.filter(m => !m.keepgoing);

  filtered = sortMembers(filtered, sortKey, sortDir);

  const setSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const exportTable = () => {
    const header = ['Nombre', 'No. Socio', 'RP', 'APP', 'SPORTLAB', 'KEEP GOING', 'Riesgo', 'Fecha de alta'];
    const rows = filtered.map(m => [
      m.name, m.member_no || '', m.rp || '', m.app_downloaded ? 'Sí' : 'No',
      m.sportlab ? 'Sí' : 'No', m.keepgoing ? 'Sí' : 'No', m.risk || '', m.alta_date || '',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vivo47-concentrado-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>Panel general</div>
          <div style={{ fontSize: 13, color: '#8B877F', marginTop: 4 }}>Sucursal Naciones Unidas · Julio 2026</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>{totalAll}</div>
          <div style={{ fontSize: 12, color: '#8B877F' }}>socios activos</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#948F86' }}>Total socios</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#18181B' }}>{totalAll}</div>
        </div>
        {(['app', 'sportlab', 'keepgoing'] as const).map(k => (
          <div key={k} style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#948F86' }}>
              {k === 'app' ? 'APP Descargada' : k === 'sportlab' ? 'SPORTLAB' : 'KEEP GOING'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 600, color: '#18181B' }}>{kpis[k].count}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: kpis[k].color }}>{kpis[k].pctLabel}</span>
            </div>
          </div>
        ))}
        <div style={{ background: '#FBEAEA', border: '1px solid #F4CCCA', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#B42318' }}>Riesgo alto</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 600, color: '#B42318' }}>{kpis.riesgoAlto.count}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#B42318' }}>{kpis.riesgoAlto.pctLabel}</span>
          </div>
        </div>
      </div>

      {perRep.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#18181B' }}>Por representante</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {perRep.map(rep => (
              <div key={rep.name} style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 999, background: '#EFEDE9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: '#4A4640', flex: 'none' }}>
                    {initialsOf(rep.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#18181B' }}>{rep.name}</div>
                    <div style={{ fontSize: 12, color: '#8B877F' }}>{rep.count} socios</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'APP', pct: rep.appPct },
                    { label: 'SPORTLAB', pct: rep.sportlabPct },
                    { label: 'KEEP GOING', pct: rep.keepgoingPct },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6E6A64' }}>
                        <span>{row.label}</span>
                        <span style={{ fontWeight: 600, color: tierColor(row.pct) }}>{row.pct}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: '#EEEBE5', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: tierColor(row.pct), width: `${row.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar socio por nombre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, border: '1px solid #E4E1DC', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: '#2B2926' }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={pillBtnStyle(rpFilter === 'todos')} onClick={() => setRpFilter('todos')}>Todos</button>
          {reps.map(r => (
            <button key={r} style={pillBtnStyle(rpFilter === r)} onClick={() => setRpFilter(r)}>{r}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={pillBtnStyle(quickFilter === 'riesgoalto')} onClick={() => setQuickFilter(f => f === 'riesgoalto' ? 'ninguno' : 'riesgoalto')}>Riesgo alto</button>
          <button style={pillBtnStyle(quickFilter === 'sinkeepgoing')} onClick={() => setQuickFilter(f => f === 'sinkeepgoing' ? 'ninguno' : 'sinkeepgoing')}>Sin Keep Going</button>
        </div>
      </div>

      <datalist id="rp-suggestions">
        {reps.map(r => <option key={r} value={r} />)}
      </datalist>

      <div style={{ background: '#fff', border: '1px solid #E4E1DC', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#FAFAF9' }}>
                {COLUMNS.map(col => (
                  <th key={col.key} style={{ textAlign: col.align, padding: '12px 20px', borderBottom: '1px solid #E4E1DC', background: '#FAFAF9' }}>
                    <button
                      onClick={() => setSort(col.key)}
                      style={{ ...sortHeaderStyle(), justifyContent: col.align === 'center' ? 'center' : 'flex-start', width: '100%' }}
                    >
                      {col.label}
                      <span>{sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid #EEEBE5' }}>
                  <td style={{ padding: '10px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontWeight: 600, color: '#2B2926', cursor: 'pointer' }} onClick={() => onViewProfile(m.id)}>{m.name}</span>
                      <input
                        type="text"
                        placeholder="No. de socio"
                        defaultValue={m.member_no ?? ''}
                        onBlur={e => { if (e.target.value !== (m.member_no ?? '')) updateMember(m.id, { member_no: e.target.value || null }); }}
                        style={{ border: '1px solid #E4E1DC', borderRadius: 6, padding: '3px 6px', fontSize: 12, color: '#8B877F', width: 110, fontFamily: 'inherit' }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '8px 20px' }}>
                    <input
                      type="text"
                      list="rp-suggestions"
                      placeholder="Sin asignar"
                      defaultValue={m.rp ?? ''}
                      onBlur={e => { if (e.target.value !== (m.rp ?? '')) updateMember(m.id, { rp: e.target.value || null }); }}
                      style={{ border: '1px solid #E4E1DC', borderRadius: 7, padding: '6px 8px', fontSize: 13, fontFamily: 'inherit', color: '#2B2926', background: '#fff', width: 150 }}
                    />
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <button style={checkButtonStyle(m.app_downloaded)} onClick={() => updateMember(m.id, { app_downloaded: !m.app_downloaded })}>
                      {m.app_downloaded ? '✓' : '✕'}
                    </button>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <button style={checkButtonStyle(m.sportlab)} onClick={() => updateMember(m.id, { sportlab: !m.sportlab })}>
                      {m.sportlab ? '✓' : '✕'}
                    </button>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <button style={checkButtonStyle(m.keepgoing)} onClick={() => updateMember(m.id, { keepgoing: !m.keepgoing })}>
                      {m.keepgoing ? '✓' : '✕'}
                    </button>
                  </td>
                  <td style={{ padding: '14px 20px' }}><span style={riskBadgeStyle(m.risk)}>{m.risk || 'Sin evaluar'}</span></td>
                  <td style={{ padding: '14px 20px', color: '#4A4640' }}>{formatDate(m.alta_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E4E1DC', fontSize: 13, color: '#8B877F' }}>
          <span>Mostrando {filtered.length} de {totalAll} socios</span>
          <button
            onClick={exportTable}
            style={{ background: 'none', border: '1px solid #D9D5CE', padding: '6px 14px', borderRadius: 7, fontSize: 13, color: '#2B2926', cursor: 'pointer' }}
          >
            Exportar tabla
          </button>
        </div>
      </div>

    </div>
  );
}
