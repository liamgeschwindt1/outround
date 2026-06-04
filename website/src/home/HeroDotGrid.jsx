import { useEffect, useRef } from 'react';

const SPACING = 28;
const DOT_RADIUS = 1;
const BASE_OPACITY = 0.07;
const PULSE_MIN = 0.05;
const PULSE_MAX = 0.12;
const PULSE_PERIOD = 3000;

export default function HeroDotGrid() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let startTime = null;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;

      // sine in-out breath: 0..1
      const t = (Math.sin((elapsed / PULSE_PERIOD) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      const opacity = PULSE_MIN + (PULSE_MAX - PULSE_MIN) * t;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = `rgba(242,241,239,${opacity})`;

      const cols = Math.ceil(canvas.width / SPACING) + 1;
      const rows = Math.ceil(canvas.height / SPACING) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * SPACING;
          const y = r * SPACING;
          ctx.beginPath();
          ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }
      }
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
}
