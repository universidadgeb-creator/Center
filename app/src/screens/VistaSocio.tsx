import { useMemo, useState } from 'react';
import type { Member } from '../lib/types';
import { chipStyle, formatDate, initialsOf, riskBadgeStyle } from '../lib/style';
import { getEvaluacion, scoreOrDash } from '../lib/evaluation';
import { useComments } from '../hooks/useComments';

const fieldLabel: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase',
  color: '#948F86', marginBottom: 6,
};
const fieldValue: React.CSSProperties = { fontSize: 15, lineHeight: 1.5, color: '#2B2926' };
const fieldRow: React.CSSProperties = { padding: '14px 0', borderBottom: '1px solid #EEEBE5' };
const card: React.CSSProperties = { background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 6 };
const cardLabel: React.CSSProperties = { fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#948F86' };

function IntakeField({ label, value }: { label: string; value: string | null }) {
  return (
    <div style={fieldRow}>
      <div style={fieldLabel}>{label}</div>
      <div style={fieldValue}>{value || '—'}</div>
    </div>
  );
}

function Blockquote({ label, value }: { label: string; value: string | null }) {
  return (
    <div style={fieldRow}>
      <div style={{ ...fieldLabel, marginBottom: 8 }}>{label}</div>
      <div style={{ borderLeft: '3px solid #B08D45', background: '#FAF8F3', padding: '12px 18px', fontSize: 15, lineHeight: 1.55, color: '#2B2926' }}>
        {value || '—'}
      </div>
    </div>
  );
}

export function VistaSocio({
  members,
  selectedMemberId,
  onSelectMember,
}: {
  members: Member[];
  selectedMemberId: string | null;
  onSelectMember: (id: string) => void;
}) {
  const [search, setSearch] = useState('');

  const selected = useMemo(
    () => members.find(m => m.id === selectedMemberId) ?? members[0] ?? null,
    [members, selectedMemberId]
  );

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return members.filter(m => m.name.toLowerCase().includes(q)).slice(0, 6);
  }, [members, search]);

  const { comments, addComment } = useComments(selected?.id ?? null);
  const [newComment, setNewComment] = useState('');

  if (!selected) {
    return (
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 32 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: 32, textAlign: 'center', color: '#8B877F', fontSize: 14 }}>
          Aún no hay socios cargados. Se sincronizarán automáticamente desde el formulario de alta.
        </div>
      </div>
    );
  }

  const evaluacion = getEvaluacion(selected);

  const handleSaveComment = async () => {
    const text = newComment.trim();
    if (!text) return;
    await addComment('Tú (Staff)', text);
    setNewComment('');
  };

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <input
          type="text"
          placeholder="Buscar socio por nombre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: '1px solid #E4E1DC', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontFamily: 'inherit', color: '#2B2926', maxWidth: 340 }}
        />
        {search.trim().length > 0 && (
          <div style={{ position: 'absolute', top: 44, left: 0, width: 340, background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', zIndex: 15, overflow: 'hidden' }}>
            {matches.map(m => (
              <div
                key={m.id}
                onClick={() => { onSelectMember(m.id); setSearch(''); }}
                style={{ padding: '10px 14px', borderBottom: '1px solid #EEEBE5', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#2B2926' }}>{m.name}</span>
                <span style={{ fontSize: 11, color: '#8B877F' }}>{m.member_no || 'Sin no. de socio'} · {m.rp || 'Sin RP'}</span>
              </div>
            ))}
            {matches.length === 0 && (
              <div style={{ padding: '10px 14px', fontSize: 13, color: '#ACA79E' }}>Sin resultados.</div>
            )}
          </div>
        )}
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ width: 76, height: 76, borderRadius: 999, background: '#EFEDE9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 600, color: '#4A4640', flex: 'none' }}>
          {initialsOf(selected.name)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>{selected.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13, color: '#6E6A64' }}>
            <span style={{ background: '#F4F2ED', color: '#4A4640', fontWeight: 600, padding: '3px 10px', borderRadius: 999, fontSize: 12 }}>
              {selected.member_no || 'Sin no. de socio'}
            </span>
            <span>RP: {selected.rp || 'Sin asignar'}</span>
            <span style={{ color: '#D8D3CB' }}>·</span>
            <span>Alta: {formatDate(selected.alta_date)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, background: '#E8F5EC', color: '#1E7A42', fontSize: 13, fontWeight: 500 }}>
            <span style={{ fontWeight: 700 }}>✓</span> Encuesta
          </div>
          <div style={chipStyle(selected.app_downloaded)}>{selected.app_downloaded ? '✓' : '–'} APP Descargada</div>
          <div style={chipStyle(selected.sportlab)}>{selected.sportlab ? '✓' : '–'} SPORTLAB</div>
          <div style={chipStyle(selected.keepgoing)}>{selected.keepgoing ? '✓' : '–'} KEEP GOING</div>
        </div>
        <div style={{ fontSize: 12, color: '#ACA79E' }}>La encuesta es el punto de entrada al sistema y no puede desactivarse.</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#18181B' }}>Evaluación</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>

          <div style={card}>
            <div style={cardLabel}>Enfoque</div>
            <div style={{ fontSize: 30, fontWeight: 600, color: '#18181B' }}>
              {scoreOrDash(evaluacion.enfoque.score)}<span style={{ fontSize: 15, color: '#ACA79E', fontWeight: 500 }}>/10</span>
            </div>
            <div style={{ fontSize: 12, color: '#8B877F' }}>{evaluacion.enfoque.label || '—'}</div>
          </div>

          <div style={card}>
            <div style={cardLabel}>Adherencia</div>
            <div style={{ fontSize: 30, fontWeight: 600, color: '#18181B' }}>
              {scoreOrDash(evaluacion.adherencia.score)}<span style={{ fontSize: 15, color: '#ACA79E', fontWeight: 500 }}>/10</span>
            </div>
          </div>

          <div style={card}>
            <div style={cardLabel}>Frecuencia</div>
            <div style={{ fontSize: 30, fontWeight: 600, color: '#18181B' }}>
              {scoreOrDash(evaluacion.frecuencia.score)}<span style={{ fontSize: 15, color: '#ACA79E', fontWeight: 500 }}>/10</span>
            </div>
          </div>

          <div style={card}>
            <div style={cardLabel}>Condición</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>{evaluacion.condicion.level || '—'}</div>
            <div style={{ fontSize: 12, color: '#8B877F' }}>Puntuación: {scoreOrDash(evaluacion.condicion.score)}/10</div>
          </div>

          <div style={{ ...card, gap: 8 }}>
            <div style={cardLabel}>Riesgo de abandono</div>
            <div style={{ fontSize: 30, fontWeight: 600, color: '#18181B' }}>
              {scoreOrDash(evaluacion.riesgo.score)}<span style={{ fontSize: 15, color: '#ACA79E', fontWeight: 500 }}>/10</span>
            </div>
            <span style={riskBadgeStyle(selected.risk)}>{selected.risk || 'Sin evaluar'}</span>
          </div>

          <div style={card}>
            <div style={cardLabel}>Nivel general</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#18181B' }}>{evaluacion.nivelGeneral.label || '—'}</div>
          </div>

        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: '28px 32px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#18181B', marginBottom: 18 }}>Datos de intake</div>

        <IntakeField label="Objetivo principal" value={selected.objetivo} />
        <IntakeField label="Meta a 90 días" value={selected.meta90} />
        <IntakeField label="Relación actual con el ejercicio" value={selected.relacion} />
        <IntakeField label="Días disponibles para entrenar por semana" value={selected.dias} />
        <IntakeField label="Condición física percibida" value={selected.condicion_perc} />
        <IntakeField label="Qué siente que más necesita mejorar hoy" value={selected.mejorar} />
        <IntakeField label="Por qué ha abandonado el ejercicio antes" value={selected.abandono} />
        <IntakeField label="Qué le ayudaría a mantenerse constante" value={selected.ayudaria} />

        <div style={fieldRow}>
          <div style={{ ...fieldLabel, marginBottom: 8 }}>Nivel de confianza (1–10)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, height: 8, borderRadius: 999, background: '#EEEBE5', overflow: 'hidden', maxWidth: 280 }}>
              <div style={{ height: '100%', borderRadius: 999, background: '#18181B', width: `${(selected.confianza ?? 0) * 10}%` }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#18181B' }}>{scoreOrDash(selected.confianza)}/10</div>
          </div>
        </div>

        <Blockquote label="Nota a su yo futuro" value={selected.nota_futuro} />
        <Blockquote label="Lo que se diría en sus momentos difíciles" value={selected.momentos} />

        <div style={{ padding: '14px 0' }}>
          <div style={fieldLabel}>Celular</div>
          <div style={fieldValue}>{selected.phone || '—'}</div>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E4E1DC', borderRadius: 10, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#18181B' }}>Comentarios del staff</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {selected.intake_comment && (
            <div style={{ padding: '14px 0', borderBottom: '1px solid #EEEBE5', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: '#2B2926' }}>Evaluación inicial</span>
                <span style={{ color: '#ACA79E' }}>{formatDate(selected.alta_date)}</span>
              </div>
              <div style={{ fontSize: 14, color: '#4A4640', lineHeight: 1.5 }}>{selected.intake_comment}</div>
            </div>
          )}
          {comments.map(c => (
            <div key={c.id} style={{ padding: '14px 0', borderBottom: '1px solid #EEEBE5', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: '#2B2926' }}>{c.staff}</span>
                <span style={{ color: '#ACA79E' }}>{c.comment_date}</span>
              </div>
              <div style={{ fontSize: 14, color: '#4A4640', lineHeight: 1.5 }}>{c.text}</div>
            </div>
          ))}
          {!selected.intake_comment && comments.length === 0 && (
            <div style={{ fontSize: 13, color: '#ACA79E', padding: '8px 0' }}>Aún no hay comentarios.</div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea
            placeholder="Agregar un comentario interno…"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            style={{ border: '1px solid #E4E1DC', borderRadius: 8, padding: '12px 14px', fontFamily: 'inherit', fontSize: 14, resize: 'vertical', minHeight: 72, color: '#2B2926' }}
          />
          <div>
            <button
              onClick={handleSaveComment}
              style={{ background: '#18181B', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
