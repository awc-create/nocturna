'use client';

import { useEffect, useMemo, useRef } from 'react';
import styles from './sky.module.scss';

export default function SkyOverlay({
  starDensityPct = 18, // keep it tasteful ✨
}: {
  starDensityPct?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const reduceMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  /* ===========================
     STARFIELD (viewport-fixed)
     =========================== */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: {
      x: number;
      y: number;
      r: number;
      a: number;
      s: number;
      p: number;
    }[] = [];

    let raf = 0;

    const DPR = () => Math.max(1, Math.floor(window.devicePixelRatio || 1));

    const resize = () => {
      const dpr = DPR();
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const base = (w * h) / 9000;
      const count = Math.floor(base * (starDensityPct / 50));

      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.4,
        a: 0.35 + Math.random() * 0.5,
        s: 0.5 + Math.random() * 1.8,
        p: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const time = t / 1000;

      for (const s of stars) {
        const alpha = s.a + Math.sin(time * s.s + s.p) * 0.25;

        ctx.fillStyle = `rgba(255,255,255,${Math.max(0.05, Math.min(1, alpha))})`;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    resize();
    if (!reduceMotion) raf = requestAnimationFrame(loop);
    else draw(performance.now());

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [starDensityPct, reduceMotion]);

  return (
    <>
      {/* PAGE-HEIGHT BLUE DRIFT */}
      <div className={styles.skyOverlay} aria-hidden="true" />

      {/* FIXED STAR CANVAS */}
      <canvas ref={canvasRef} className={styles.starCanvas} aria-hidden="true" />

      {/* SOFT ATMOSPHERE */}
      <div className={styles.skyGlow} aria-hidden="true" />
    </>
  );
}
