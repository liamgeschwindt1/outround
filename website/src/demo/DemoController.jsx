import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import DotGrid from './DotGrid';
import ProgressDots from './components/ProgressDots';
import MuteToggle from './components/MuteToggle';
import { useSoundManager } from './hooks/useSoundManager';

import Scene1 from './scenes/Scene1_IncomingBrief';
import Scene2 from './scenes/Scene2_PreMeetingBrief';
import Scene3 from './scenes/Scene3_TheMeeting';
import Scene4 from './scenes/Scene4_PostCallDebrief';
import Scene5 from './scenes/Scene5_CRMUpdate';
import Scene6 from './scenes/Scene6_RepProfile';
import Scene7 from './scenes/Scene7_ManagerBrief';
import Scene8 from './scenes/Scene8_IntelligenceOrb';

const SCENES = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8];
const SCENE_NAMES = [
  'Incoming brief',
  'Pre-meeting brief',
  'The meeting',
  'Post-call debrief',
  'CRM updating',
  'Rep profile',
  'Manager brief',
  'Intelligence orb',
];

const TRANSITION_LOCK_MS = 400;

export default function DemoController() {
  const [currentScene, setCurrentScene] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward
  const dotGridRef = useRef(null);
  const containerRef = useRef(null);
  const { play, stopTyping, isMuted, toggleMute, initSounds } = useSoundManager();

  const advance = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setDirection(1);
    stopTyping();

    // Trigger ripple from centre of container
    if (dotGridRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      dotGridRef.current.triggerRipple(rect.width / 2, rect.height / 2);
    }

    setTimeout(() => {
      setCurrentScene((prev) => Math.min(prev + 1, SCENES.length - 1));
      setTimeout(() => setIsTransitioning(false), TRANSITION_LOCK_MS);
    }, 300);
  }, [isTransitioning, stopTyping]);

  // Click handler — initialises sounds on first interaction
  const handleClick = useCallback(() => {
    initSounds();
    advance();
  }, [initSounds, advance]);

  // Spacebar handler
  useEffect(() => {
    function onKey(e) {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        handleClick();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClick]);

  const SceneComponent = SCENES[currentScene];

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: currentScene < SCENES.length - 1 ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Background dot grid */}
      <DotGrid ref={dotGridRef} />

      {/* Mute toggle */}
      <MuteToggle isMuted={isMuted} onToggle={toggleMute} />

      {/* Scene */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={currentScene}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SceneComponent
            isActive={true}
            onAdvance={advance}
            sceneIndex={currentScene}
            dotGridRef={dotGridRef}
            sound={{ play, stopTyping }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <ProgressDots current={currentScene} />

      {/* Aria live region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
        }}
      >
        {SCENE_NAMES[currentScene]}
      </div>
    </div>
  );
}
