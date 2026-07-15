import { useState } from 'react';
import { captureInputStyle, primaryButtonStyle } from '../lib/style';

/**
 * Small "+ dar de alta" control shared by the RP and Promoción selects — a button that
 * reveals an inline input (+ optional color swatch picker) instead of a modal, since it's
 * always a single value being added.
 */
export function AddOption({
  label,
  placeholder,
  colors,
  onAdd,
}: {
  label: string;
  placeholder: string;
  colors?: string[];
  onAdd: (value: string, color?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [color, setColor] = useState(colors?.[0] ?? '');

  const submit = () => {
    if (!value.trim()) return;
    onAdd(value.trim(), colors ? color : undefined);
    setValue('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ background: 'none', border: '1px dashed #D9D5CE', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#57534E', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        + {label}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <input
        type="text"
        autoFocus
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
        style={captureInputStyle()}
      />
      {colors && (
        <div style={{ display: 'flex', gap: 4 }}>
          {colors.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              style={{ width: 20, height: 20, borderRadius: 999, background: c, border: color === c ? '2px solid #18181B' : '1px solid #E4E1DC', cursor: 'pointer', padding: 0 }}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={!value.trim()}
        style={primaryButtonStyle(!value.trim())}
      >
        Guardar
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{ background: 'none', border: '1px solid #D9D5CE', padding: '9px 14px', borderRadius: 8, fontSize: 13, color: '#2B2926', cursor: 'pointer' }}
      >
        Cancelar
      </button>
    </div>
  );
}
