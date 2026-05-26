import { useEffect, useRef, useState } from 'react';

interface UseTypewriterOpts {
  text: string;
  speedMs?: number;
  startDelayMs?: number;
  onDone?: () => void;
  enabled?: boolean;
}

export function useTypewriter({
  text,
  speedMs = 38,
  startDelayMs = 0,
  onDone,
  enabled = true,
}: UseTypewriterOpts) {
  const [out, setOut] = useState('');
  const [done, setDone] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!enabled) { setOut(text); setDone(true); onDoneRef.current?.(); return; }

    const reduced = typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { setOut(text); setDone(true); onDoneRef.current?.(); return; }

    setOut('');
    setDone(false);
    let i = 0;
    let timer: number | undefined;
    let interval: number | undefined;

    timer = window.setTimeout(() => {
      interval = window.setInterval(() => {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length) {
          if (interval) window.clearInterval(interval);
          setDone(true);
          onDoneRef.current?.();
        }
      }, speedMs);
    }, startDelayMs);

    return () => {
      if (timer) window.clearTimeout(timer);
      if (interval) window.clearInterval(interval);
    };
  }, [text, speedMs, startDelayMs, enabled]);

  return { out, done };
}
