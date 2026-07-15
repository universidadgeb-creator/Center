import { useCallback, useRef, useState } from 'react';

export type ToastVariant = 'error' | 'success';
export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

/** Small transient notification queue — auto-dismisses each toast after 4s. */
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((message: string, variant: ToastVariant = 'error') => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return { toasts, push, dismiss };
}
