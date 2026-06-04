import { useEffect, useRef, useState, useCallback } from 'react';

const SOUND_PATHS = {
  notification: '/demo/sounds/notification.mp3',
  typing:       '/demo/sounds/typing.mp3',
  click:        '/demo/sounds/click.mp3',
  success:      '/demo/sounds/success.mp3',
  orb:          '/demo/sounds/orb.mp3',
};

export function useSoundManager() {
  const howlsRef = useRef({});
  const initialised = useRef(false);
  const [isMuted, setIsMuted] = useState(() => {
    try { return localStorage.getItem('outround_muted') === 'true'; } catch { return false; }
  });

  const init = useCallback(() => {
    if (initialised.current || typeof window === 'undefined') return;
    initialised.current = true;

    // Dynamic import Howler to avoid SSR issues
    import('howler').then(({ Howl }) => {
      howlsRef.current = {
        notification: new Howl({ src: [SOUND_PATHS.notification], volume: 0.4, preload: true }),
        typing:       new Howl({ src: [SOUND_PATHS.typing],       volume: 0.25, loop: true, preload: true }),
        click:        new Howl({ src: [SOUND_PATHS.click],        volume: 0.3,  preload: true }),
        success:      new Howl({ src: [SOUND_PATHS.success],      volume: 0.4,  preload: true }),
        orb:          new Howl({ src: [SOUND_PATHS.orb],          volume: 0.3,  preload: true }),
      };
    });
  }, []);

  const play = useCallback((name) => {
    if (isMuted) return;
    init();
    const h = howlsRef.current[name];
    if (!h) return;
    if (name === 'typing') {
      if (!h.playing()) h.play();
    } else {
      h.play();
    }
  }, [isMuted, init]);

  const stopTyping = useCallback(() => {
    howlsRef.current.typing?.stop();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      try { localStorage.setItem('outround_muted', String(next)); } catch {}
      if (next) {
        Object.values(howlsRef.current).forEach(h => h?.stop());
      }
      return next;
    });
  }, []);

  return { play, stopTyping, isMuted, toggleMute, initSounds: init };
}
