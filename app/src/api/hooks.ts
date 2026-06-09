import { useEffect, useState } from 'react';
import { api, ApiError } from './client';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(path: string | null): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return;

    let cancelled = false;

    // Defer loading/error resets via rAF so they aren't synchronous in the effect.
    // This is a standard data-fetching hook — the effect is the correct place to
    // start the request, but React warns against synchronous setState in effects.
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    });

    api
      .get<T>(path)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof ApiError ? e.message : 'Network error';
        setError(msg);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [path, tick]);

  return {
    data,
    loading: loading && path !== null,
    error,
    refetch: () => {
      setTick((t) => t + 1);
    },
  };
}
