import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const SPACING = 28;
const DOT_RADIUS = 1;
const PULSE_MIN = 0.10;
const PULSE_MAX = 0.20;
const PULSE_PERIOD = 3000;
const RIPPLE_SPEED = 400; // px/s
const RIPPLE_MAX = 600;

const DotGrid = forwardRef(function DotGrid({ slowPulse = false }, ref) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    dots: [],
    ripples: [],
    orbPull: null,
    startTime: null,
    slowPulse: false,
  });

  useImperativeHandle(ref, () => ({
    triggerRipple(x, y) {
      stateRef.current.ripples.push({ x, y, startTime: null });
    },
    triggerOrbPull() {
      stateRef.current.orbPull = { startTime: null, phase: 'pull' };
    },
  }));

  useEffect(() => {
    stateRef.current.slowPulse = slowPulse;
  }, [slowPulse]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    function buildDots() {
      const dots = [];
      const cols = Math.ceil(canvas.width / SPACING) + 1;
      const rows = Math.ceil(canvas.height / SPACING) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({ bx: c * SPACING, by: r * SPACING, ox: 0, oy: 0 });
        }
      }
      stateRef.current.dots = dots;
    }

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      buildDots();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw(ts) {
      const s = stateRef.current;
      if (!s.startTime) s.startTime = ts;
      const elapsed = ts - s.startTime;

      // Breathing
      const period = s.slowPulse ? PULSE_PERIOD * 1.5 : PULSE_PERIOD;
      const t = (Math.sin((elapsed / period) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      const baseOpacity = PULSE_MIN + (PULSE_MAX - PULSE_MIN) * t;

      // Orb pull update
      if (s.orbPull) {
        if (!s.orbPull.startTime) s.orbPull.startTime = ts;
        const pt = Math.min((ts - s.orbPull.startTime) / 2000, 1);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const pullRadius = 300;

        s.dots.forEach(d => {
          const dx = d.bx - cx;
          const dy = d.by - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < pullRadius) {
            const factor = (1 - dist / pullRadius) * 4; // max 4px
            if (pt < 1) {
              d.ox = -(dx / dist) * factor * Math.sin(pt * Math.PI);
              d.oy = -(dy / dist) * factor * Math.sin(pt * Math.PI);
            } else {
              d.ox = 0;
              d.oy = 0;
              s.orbPull = null;
            }
          }
        });
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ripple bookkeeping
      s.ripples = s.ripples.filter(r => {
        if (!r.startTime) r.startTime = ts;
        const age = (ts - r.startTime) / 1000;
        return age * RIPPLE_SPEED < RIPPLE_MAX;
      });

      s.dots.forEach(d => {
        const x = d.bx + d.ox;
        const y = d.by + d.oy;
        let opacity = baseOpacity;

        // Apply ripples
        for (const r of s.ripples) {
          if (!r.startTime) continue;
          const age = (ts - r.startTime) / 1000;
          const rippleR = age * RIPPLE_SPEED;
          const dx = x - r.x;
          const dy = y - r.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const diff = Math.abs(dist - rippleR);
          if (diff < 24) {
            const spike = (1 - diff / 24) * (1 - rippleR / RIPPLE_MAX);
            opacity = Math.min(opacity + 0.4 * spike, 0.6);
          }
        }

        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#f2f1ef';
        ctx.beginPath();
        ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
});

export default DotGrid;
