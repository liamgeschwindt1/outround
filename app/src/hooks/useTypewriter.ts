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
  const [typedOut, setTypedOut] = useState('');
  const [typedDone, setTypedDone] = useState(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const shouldAnimate = enabled && !reduced;

  useEffect(() => {
    if (!shouldAnimate) {
      return;
    }

    let i = 0;
    let intervalId: number | undefined;

    // Defer state reset so setState isn't called synchronously in the effect body
    const resetTimerId = window.setTimeout(() => {
      setTypedOut('');
      setTypedDone(false);
    }, 0);

    const animTimerId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        i += 1;
        setTypedOut(text.slice(0, i));
        if (i >= text.length) {
          window.clearInterval(intervalId);
          setTypedDone(true);
          onDoneRef.current?.();
        }
      }, speedMs);
    }, startDelayMs);

    return () => {
      window.clearTimeout(resetTimerId);
      window.clearTimeout(animTimerId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [text, speedMs, startDelayMs, shouldAnimate]);

  const out = shouldAnimate ? typedOut : text;
  const done = shouldAnimate ? typedDone : true;

  return { out, done };
}
