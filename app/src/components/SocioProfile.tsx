import { useState } from 'react';
import type { Member } from '../lib/types';
import { chipStyle, formatDate, primaryButtonStyle, riskBadgeStyle, riskLabel, riskScoreColors } from '../lib/style';
import { getEvaluacion, scoreOrDash } from '../lib/evaluation';
import { useComments } from '../hooks/useComments';
import { Card, Eyebrow } from './Card';

const fieldLabel: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase',
  color: '#948F86', marginBottom: 6,
};
const fieldValue: React.CSSProperties = { fontSize: 15, lineHeight: 1.5, color: '#2B2926' };
const fieldRow: React.CSSProperties = { padding: '14px 0', borderBottom: '1px solid #EEEBE5' };

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

/** Full member profile — evaluation, intake answers, and staff comments. Used inside the
 * Concentrado side panel (Drawer) rather than as its own screen. */
export function SocioProfile({ member }: { member: Member }) {
  const { comments, addComment } = useComments(member.id);
  const [newComment, setNewComment] = useState('');
  const evaluacion = getEvaluacion(member);

  const handleSaveComment = async () => {
    const text = newComment.trim();
    if (!text) return;
    await addComment('Tú (Staff)', text);
    setNewComment('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13, color: '#6E6A64' }}>
          <span style={{ background: '#F4F2ED', color: '#4A4640', fontWeight: 600, padding: '3px 10px', borderRadius: 999, fontSize: 12 }}>
            {member.member_no || 'Sin no. de socio'}
          </span>
          <span>RP: {member.rp || 'Sin asignar'}</span>
          <span style={{ color: '#D8D3CB' }}>·</span>
          <span>Alta: {formatDate(member.alta_date)}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, background: '#E8F5EC', color: '#1E7A42', fontSize: 13, fontWeight: 500 }}>
            <span style={{ fontWeight: 700 }}>✓</span> Encuesta
          </div>
          <div style={chipStyle(member.app_downloaded)}>{member.app_downloaded ? '✓' : '–'} APP Descargada</div>
          <div style={chipStyle(member.sportlab)}>{member.sportlab ? '✓' : '–'} SPORTLAB</div>
          <div style={chipStyle(member.keepgoing)}>{member.keepgoing ? '✓' : '–'} KEEP GOING</div>
          <div style={chipStyle(member.performance_day)}>{member.performance_day ? '✓' : '–'} Performance Day</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#18181B' }}>Evaluación</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>

          <Card gap={6}>
            <Eyebrow>Enfoque</Eyebrow>
            <div style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>
              {scoreOrDash(evaluacion.enfoque.score)}<span style={{ fontSize: 13, color: '#ACA79E', fontWeight: 500 }}>/10</span>
            </div>
            <div style={{ fontSize: 12, color: '#8B877F' }}>{evaluacion.enfoque.label || '—'}</div>
          </Card>

          <Card gap={6}>
            <Eyebrow>Adherencia</Eyebrow>
            <div style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>
              {scoreOrDash(evaluacion.adherencia.score)}<span style={{ fontSize: 13, color: '#ACA79E', fontWeight: 500 }}>/10</span>
            </div>
          </Card>

          <Card gap={6}>
            <Eyebrow>Frecuencia</Eyebrow>
            <div style={{ fontSize: 26, fontWeight: 600, color: '#18181B' }}>
              {scoreOrDash(evaluacion.frecuencia.score)}<span style={{ fontSize: 13, color: '#ACA79E', fontWeight: 500 }}>/10</span>
            </div>
          </Card>

          <Card gap={6}>
            <Eyebrow>Condición</Eyebrow>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#18181B' }}>{evaluacion.condicion.level || '—'}</div>
            <div style={{ fontSize: 12, color: '#8B877F' }}>Puntuación: {scoreOrDash(evaluacion.condicion.score)}/10</div>
          </Card>

          <Card gap={8}>
            <Eyebrow>Riesgo de abandono</Eyebrow>
            <div style={{ fontSize: 26, fontWeight: 600, color: riskScoreColors(evaluacion.riesgo.score).text }}>
              {scoreOrDash(evaluacion.riesgo.score)}<span style={{ fontSize: 13, color: '#ACA79E', fontWeight: 500 }}>/10</span>
            </div>
            <span style={riskBadgeStyle(member.risk, evaluacion.riesgo.score)}>{riskLabel(evaluacion.riesgo.score, member.risk)}</span>
          </Card>

          <Card gap={6}>
            <Eyebrow>Nivel general</Eyebrow>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#18181B' }}>{evaluacion.nivelGeneral.label || '—'}</div>
          </Card>

        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#18181B', marginBottom: 12 }}>Datos de intake</div>

        <IntakeField label="Objetivo principal" value={member.objetivo} />
        <IntakeField label="Meta a 90 días" value={member.meta90} />
        <IntakeField label="Relación actual con el ejercicio" value={member.relacion} />
        <IntakeField label="Días disponibles para entrenar por semana" value={member.dias} />
        <IntakeField label="Condición física percibida" value={member.condicion_perc} />
        <IntakeField label="Qué siente que más necesita mejorar hoy" value={member.mejorar} />
        <IntakeField label="Por qué ha abandonado el ejercicio antes" value={member.abandono} />
        <IntakeField label="Qué le ayudaría a mantenerse constante" value={member.ayudaria} />

        <div style={fieldRow}>
          <div style={{ ...fieldLabel, marginBottom: 8 }}>Nivel de confianza (1–10)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, height: 8, borderRadius: 999, background: '#EEEBE5', overflow: 'hidden', maxWidth: 220 }}>
              <div style={{ height: '100%', borderRadius: 999, background: '#18181B', width: `${(member.confianza ?? 0) * 10}%` }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#18181B' }}>{scoreOrDash(member.confianza)}/10</div>
          </div>
        </div>

        <Blockquote label="Nota a su yo futuro" value={member.nota_futuro} />
        <Blockquote label="Lo que se diría en sus momentos difíciles" value={member.momentos} />

        <div style={{ padding: '14px 0' }}>
          <div style={fieldLabel}>Celular</div>
          <div style={fieldValue}>{member.phone || '—'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#18181B' }}>Comentarios del staff</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {member.intake_comment && (
            <div style={{ padding: '14px 0', borderBottom: '1px solid #EEEBE5', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: '#2B2926' }}>Evaluación inicial</span>
                <span style={{ color: '#ACA79E' }}>{formatDate(member.alta_date)}</span>
              </div>
              <div style={{ fontSize: 14, color: '#4A4640', lineHeight: 1.5 }}>{member.intake_comment}</div>
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
          {!member.intake_comment && comments.length === 0 && (
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
              style={primaryButtonStyle()}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
