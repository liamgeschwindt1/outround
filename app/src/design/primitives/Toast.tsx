import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { T, R } from '../tokens';

type ToastKind = 'info' | 'success' | 'error';
interface Toast {
  id: number;
  msg: string;
  kind: ToastKind;
}

const Ctx = createContext<{ push: (msg: string, kind?: ToastKind) => void }>({
  push: () => undefined,
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((msg: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { id, msg, kind }]);
    setTimeout(() => {
      setItems((xs) => xs.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 9999,
        }}
      >
        {items.map((t) => (
          <div
            key={t.id}
            style={{
              background: T.bgElevate,
              border: `1px solid ${t.kind === 'error' ? 'rgba(220,38,38,0.4)' : t.kind === 'success' ? 'rgba(22,163,74,0.4)' : T.borderMd}`,
              color: T.t1,
              padding: '10px 14px',
              borderRadius: R.md,
              fontSize: 13,
              maxWidth: 360,
              animation: 'fade-in-up 180ms ease',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
