import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const AXES = ['Discovery', 'Objection\nHandling', 'Pricing', 'Closing', 'Talk\nRatio', 'Follow-up'];
const SCORES = [8.4, 5.2, 4.8, 7.1, 6.3, 7.8];
const MAX = 10;
const N = AXES.length;

function toXY(angle, r, cx, cy) {
  return {
    x: cx + r * Math.cos(angle - Math.PI / 2),
    y: cy + r * Math.sin(angle - Math.PI / 2),
  };
}

function RepRadar({ size = 240, animated = false }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.35;
    const labelR = size * 0.46;

    let progress = animated ? 0 : 1;
    const startTime = performance.now();
    const duration = 800;

    function draw(p) {
      ctx.clearRect(0, 0, size, size);

      // Background rings
      for (let ring = 1; ring <= 4; ring++) {
        const r = (ring / 4) * maxR;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const angle = (i / N) * Math.PI * 2;
          const pt = toXY(angle, r, cx, cy);
          i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(242,241,239,0.07)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Axis lines
      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2;
        const pt = toXY(angle, maxR, cx, cy);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(pt.x, pt.y);
        ctx.strokeStyle = 'rgba(242,241,239,0.09)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Score polygon
      const pts = SCORES.map((s, i) => {
        const angle = (i / N) * Math.PI * 2;
        const r = (s / MAX) * maxR * p;
        return toXY(angle, r, cx, cy);
      });

      // Fill
      const grad = ctx.createLinearGradient(cx - maxR, cy, cx + maxR, cy);
      grad.addColorStop(0, 'rgba(242,107,69,0.2)');
      grad.addColorStop(1, 'rgba(75,163,227,0.2)');
      ctx.beginPath();
      pts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Stroke
      ctx.beginPath();
      pts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.closePath();
      ctx.strokeStyle = 'rgba(242,107,69,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Dots
      pts.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#f26b45';
        ctx.fill();
      });

      // Labels
      ctx.save();
      for (let i = 0; i < N; i++) {
        const angle = (i / N) * Math.PI * 2;
        const pt = toXY(angle, labelR, cx, cy);
        const lines = AXES[i].split('\n');
        ctx.font = `500 9px "JetBrains Mono", monospace`;
        ctx.fillStyle = 'rgba(242,241,239,0.35)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        lines.forEach((line, li) => {
          ctx.fillText(line.toUpperCase(), pt.x, pt.y + (li - (lines.length - 1) / 2) * 12);
        });
      }
      ctx.restore();
    }

    if (!animated) {
      draw(1);
      return;
    }

    function frame(ts) {
      progress = Math.min((ts - startTime) / duration, 1);
      // ease out cubic
      const p = 1 - Math.pow(1 - progress, 3);
      draw(p);
      if (progress < 1) animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [size, animated]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
}

RepRadar.propTypes = {
  size: PropTypes.number,
  animated: PropTypes.bool,
};

export default RepRadar;
