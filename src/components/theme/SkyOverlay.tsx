'use client';

import { useEffect, useMemo, useRef } from 'react';
import styles from './sky.module.scss';

type Mode = 'scroll' | 'time' | 'hybrid';

export default function SkyOverlay({
  mode = 'hybrid',
  strength = 1, // 0..1: how fast it reaches black
  topPaddingPx = 0, // your fixed navbar height if any
  starDensityPct = 35, // 0..100 density control
}: {
  mode?: Mode;
  strength?: number;
  topPaddingPx?: number;
  starDensityPct?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // detect reduced motion (don’t animate if user prefers)
  const reduceMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  /* -----------------------------
     Navy → Black background logic
  ------------------------------*/
  useEffect(() => {
    const root = document.documentElement;

    const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const timeFactor = () => {
      const now = new Date();
      const h = now.getHours() + now.getMinutes() / 60;
      if (h >= 18) return (h - 18) / 12; // 18..30 -> 0..1
      if (h < 6) return (h + 6) / 12; // 0..6  -> ~0.5..1
      return 0.15; // daytime: slight night bias
    };

    const scrollFactor = () => {
      const doc = document.scrollingElement || document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight - topPaddingPx);
      const y = (window.scrollY - topPaddingPx) / max;
      return clamp(Math.pow(Math.max(0, y), 0.9));
    };

    const compute = () => {
      const t = timeFactor();
      const s = scrollFactor();
      const mixed = mode === 'time' ? t : mode === 'scroll' ? s : lerp(t, s, 0.6); // hybrid favors scroll responsiveness

      const v = clamp(mixed * strength, 0, 1);
      root.style.setProperty('--night-t', v.toFixed(4));
    };

    compute();
    const onScrollOrResize = () => requestAnimationFrame(compute);
    const minuteTimer = window.setInterval(compute, 60_000);
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      window.clearInterval(minuteTimer);
    };
  }, [mode, strength, topPaddingPx]);

  /* -----------------------------
     STARFIELD (random sparkle)
  ------------------------------*/
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    type Star = {
      x: number;
      y: number;
      r: number;
      baseA: number;
      speed: number;
      phase: number;
      // burst params
      nextBurstAt: number;
      burstEnd: number;
      burstAmp: number;
    };

    let stars: Star[] = [];
    let raf = 0;
    let running = true;

    const DPR = () => Math.max(1, Math.floor(window.devicePixelRatio || 1));

    const resize = () => {
      const dpr = DPR();
      const w = Math.ceil(window.innerWidth);
      const h = Math.ceil(window.innerHeight);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // density → count; tune divisor to taste (bigger = fewer stars)
      const pct = Math.max(0, Math.min(100, starDensityPct));
      const base = (w * h) / 9500; // ~0.000105 stars per px
      const count = Math.floor(base * (pct / 50)); // 50% ≈ base

      // helper for randomized times (seconds)
      const now = performance.now() / 1000;
      const rand = (a: number, b: number) => a + Math.random() * (b - a);

      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.5 + Math.random() * 1.1, // radius 0.5..1.6
        baseA: 0.38 + Math.random() * 0.36, // alpha 0.38..0.74
        speed: rand(0.7, 2.8), // twinkle speed (Hz-ish)
        phase: Math.random() * Math.PI * 2, // desync
        nextBurstAt: now + rand(1.5, 6.0), // first burst window
        burstEnd: 0,
        burstAmp: rand(0.25, 0.55), // extra brightness during burst
      }));
    };

    const smoothstep = (t: number) => t * t * (3 - 2 * t);

    const draw = (nowMs: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const t = nowMs / 1000;

      for (const s of stars) {
        // base twinkle
        const amp = 0.3; // base twinkle amplitude (↑ if you want more obvious)
        let a = s.baseA + amp * Math.sin(t * s.speed + s.phase);

        // micro-burst: short extra brightening with a soft ease in/out
        // schedule new bursts when time passes nextBurstAt
        if (t >= s.nextBurstAt) {
          s.burstEnd = t + 0.35 + Math.random() * 0.35; // 0.35..0.7s
          s.nextBurstAt = t + 1.8 + Math.random() * 6.0; // next in 1.8..7.8s
        }
        if (t < s.burstEnd) {
          const p = 1 - (s.burstEnd - t) / (s.burstEnd - (s.nextBurstAt - (1.8 + 6.0))); // not used, keep simple
          // simpler timing: map remaining time into [0..1]
          const dur = Math.max(0.35, Math.min(0.7, s.burstEnd - (s.nextBurstAt - (1.8 + 6.0))));
          const elapsed = Math.max(0, Math.min(dur, t - (s.burstEnd - dur)));
          const k = smoothstep(Math.min(1, Math.max(0, elapsed / dur)));
          a += s.burstAmp * Math.sin(k * Math.PI); // up then down
        }

        // clamp alpha
        a = Math.max(0.05, Math.min(1, a));

        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (ts: number) => {
      if (!running) return;
      draw(ts);
      raf = requestAnimationFrame(loop);
    };

    resize();
    // animate unless user prefers reduced motion
    if (!reduceMotion) raf = requestAnimationFrame(loop);
    else draw(performance.now());

    window.addEventListener('resize', resize, { passive: true });
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [starDensityPct, reduceMotion]);

  return (
    <>
      <div className={styles.skyOverlay} aria-hidden="true" />
      <canvas ref={canvasRef} className={styles.starCanvas} aria-hidden="true" />
      <div className={styles.skyHorizon} aria-hidden="true" />
    </>
  );
}
