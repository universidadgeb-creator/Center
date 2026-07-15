import type { ToastItem } from '../hooks/useToast';

/** Fixed bottom-right stack; click any toast to dismiss it early. */
export function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50 }}>
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          style={{
            background: t.variant === 'error' ? '#B42318' : '#1E7A42',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(0,0,0,0.16)',
            cursor: 'pointer',
            maxWidth: 340,
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
