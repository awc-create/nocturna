'use client';

import Head from 'next/head';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './Hero.module.scss';
import Link from 'next/link';
import { motion } from 'framer-motion';

type MediaType = 'VIDEO' | 'IMAGE';

type HeroConfig = {
  mediaType: MediaType;
  imageSrc: string;
  videoSrc?: string | null;
  posterSrc?: string | null;
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  overlayDarkness: number;

  loopStartSec?: number;
  loopEndSec?: number;
  startPausedForReturning?: boolean;
};

const FALLBACK: HeroConfig = {
  mediaType: 'VIDEO',
  imageSrc: '/assets/about-hero.jpg',
  videoSrc: '',
  posterSrc: '',
  title: 'NOCTURNA',
  description:
    'Nocturna curates DJs and live acts to shape atmosphere-first nights for venues and brands.',
  ctaText: 'WORK WITH US',
  ctaHref: '/apply',
  overlayDarkness: 0.55,
  loopStartSec: 4,
  loopEndSec: 10,
  startPausedForReturning: true,
};

type Mode = 'idle' | 'cinematic' | 'loop';

export default function AboutHero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [cfg, setCfg] = useState<HeroConfig>(FALLBACK);
  const [mode, setMode] = useState<Mode>('idle');
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [idleDim, setIdleDim] = useState(0.22); // extra darkness when paused/idle

  // Load config
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch('/api/about/hero', { cache: 'no-store' });
        if (!res.ok) throw new Error('failed');
        const data = (await res.json()) as Partial<HeroConfig>;
        if (live) setCfg({ ...FALLBACK, ...data });
      } catch {
        /* fallback */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const loopStart = Math.max(0, cfg.loopStartSec ?? 0);
  const loopEnd = Math.max(loopStart + 0.25, cfg.loopEndSec ?? loopStart + 6);

  const hasVideo = cfg.mediaType === 'VIDEO' && !!cfg.videoSrc;

  // ---------- Playback helpers ----------
  const stopRAF = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const startLoopGuard = useCallback(() => {
    stopRAF();
    const tick = () => {
      const v = videoRef.current;
      if (v) {
        if (mode === 'loop') {
          if (v.currentTime >= loopEnd - 0.01) {
            try {
              v.currentTime = loopStart;
            } catch {}
          }
        }
        setCurrent(v.currentTime);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [loopEnd, loopStart, mode]);

  const playFrom = async (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.currentTime = Math.max(0, Math.min(t, v.duration || t));
      await v.play();
    } catch {
      /* autoplay may be blocked */
    }
  };

  const playCinematic = async () => {
    setMode('cinematic');
    await playFrom(0);
  };

  const startLoopWallpaper = async () => {
    if (!hasVideo) return;
    const v = videoRef.current;
    if (!v) return;
    try {
      v.muted = true;
      if (v.currentTime < loopStart || v.currentTime > loopEnd) {
        v.currentTime = loopStart;
      }
      await v.play();
      setMode('loop');
    } catch {
      setMode('idle');
    }
  };

  const pauseVideo = () => {
    const v = videoRef.current;
    if (v) v.pause();
    setMode('idle');
  };

  // ---------- Wire events ----------
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoaded = () => {
      setDuration(v.duration || 0);
    };
    const onTime = () => {
      setCurrent(v.currentTime);
      if (mode === 'loop' && v.currentTime >= loopEnd - 0.01) {
        v.currentTime = loopStart;
      }
    };
    const onEnded = () => {
      setMode('idle'); // cinematic finished → freeze/idle
    };

    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended', onEnded);
    startLoopGuard();

    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('ended', onEnded);
      stopRAF();
    };
  }, [loopEnd, loopStart, mode, startLoopGuard]);

  // Initial mode: keep idle until user interacts
  useEffect(() => {
    if (!hasVideo) return;
    setMode('idle');
  }, [hasVideo]);

  // Scrub handler
  const onScrub = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const t = Number(e.currentTarget.value);
    try {
      v.currentTime = t;
      setCurrent(t);
      if (mode !== 'cinematic') setMode('cinematic');
    } catch {}
  };

  // Darkness: overlay + extra when idle
  const darkness = Math.min(1, Math.max(0, cfg.overlayDarkness ?? 0.5));
  const extraDim = mode === 'idle' ? idleDim : 0;

  const videoKey = `${cfg.videoSrc || 'novid'}-${mode}`;
  const posterToUse = cfg.posterSrc && cfg.posterSrc.length ? cfg.posterSrc : undefined;
  const showControls = hasVideo && duration > 0; // derived — no unused setter

  return (
    <>
      <Head>
        {cfg.posterSrc ? <link rel="preload" href={cfg.posterSrc} as="image" /> : null}
        {cfg.videoSrc ? <link rel="preload" href={cfg.videoSrc} as="video" /> : null}
      </Head>

      <header className={styles.hero} role="banner" aria-label="About hero">
        {/* Media */}
        <div className={`${styles.media} ${!hasVideo ? styles.noMedia : ''}`} aria-hidden="true">
          {hasVideo ? (
            <motion.video
              ref={videoRef}
              key={videoKey}
              className={`${styles.video} ${mode === 'loop' ? styles.wallpaper : ''}`}
              autoPlay={false}
              muted
              playsInline
              preload="metadata"
              loop={false}
              poster={posterToUse}
              style={{ objectFit: 'cover', objectPosition: '50% 40%' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <source src={cfg.videoSrc!} type="video/mp4" />
            </motion.video>
          ) : (
            <div className={styles.fallbackBg} />
          )}
        </div>

        {/* Adjustable overlay + extra dim when idle */}
        <div
          className={styles.overlay}
          style={{
            background:
              `linear-gradient(to bottom, rgba(0,0,0,${darkness * 0.9 + extraDim}) 0%, rgba(0,0,0,${darkness + extraDim}) 40%, rgba(0,0,0,${Math.min(
                1,
                darkness + 0.05 + extraDim
              )}) 100%),` +
              `radial-gradient(100% 60% at 50% 20%, rgba(0,0,0,${(darkness + extraDim) * 0.6}), transparent 60%)`,
          }}
        />

        {/* Content */}
        <div className={styles.content}>
          <h1 className={styles.kicker}>
            <span className={styles.badge}>ABOUT</span> NOCTURNA
          </h1>
          <p className={styles.subtitle}>ALEX &amp; ALIN — WHO WE ARE</p>
          <p className={styles.tagline}>{cfg.description}</p>
          <div className={styles.actions}>
            <Link href={cfg.ctaHref} className={styles.ctaPrimary}>
              {cfg.ctaText}
            </Link>
          </div>
        </div>

        {/* Controls deck */}
        <div className={styles.controlsDeck}>
          {/* Center “Play video” when idle */}
          {hasVideo && mode === 'idle' && (
            <button
              className={styles.playCenter}
              onClick={playCinematic}
              aria-label="Play full video"
              title="Play full video"
            >
              ▶ <span>Play video</span>
            </button>
          )}

          {/* Bottom-right: loop/full toggle */}
          {hasVideo && (
            <button
              className={styles.replayBtn}
              onClick={mode === 'loop' ? playCinematic : startLoopWallpaper}
              title={mode === 'loop' ? 'Play full video' : 'Play as live wallpaper'}
            >
              {mode === 'loop' ? 'Play full' : 'Wallpaper'}
            </button>
          )}

          {/* Bottom center: transport bar */}
          {hasVideo && showControls && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: '28px',
                transform: 'translateX(-50%)',
                zIndex: 8,
                display: 'grid',
                gap: 8,
                background: 'rgba(0,0,0,.4)',
                border: '1px solid rgba(255,255,255,.18)',
                borderRadius: 12,
                padding: '8px 10px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={async () => {
                    const v = videoRef.current;
                    if (!v) return;
                    if (v.paused || mode === 'idle') {
                      setMode('cinematic');
                      try {
                        await v.play(); // <-- await fixes TS2801
                      } catch {
                        /* ignored */
                      }
                    } else {
                      pauseVideo();
                    }
                  }}
                  style={pillBtn}
                  title="Play/Pause"
                >
                  {videoRef.current?.paused || mode === 'idle' ? 'Play' : 'Pause'}
                </button>

                <button
                  onClick={() => playFrom(loopStart)}
                  style={pillBtn}
                  title={`Jump to loop (${loopStart.toFixed(1)}s)`}
                >
                  Loop
                </button>

                <input
                  type="range"
                  min={0}
                  max={Math.max(0.01, duration)}
                  step="0.01"
                  value={current}
                  onChange={onScrub}
                  style={{ width: '44vw', minWidth: 240, maxWidth: 720 }}
                  aria-label="Scrub video"
                />

                <time style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>
                  {fmt(current)} / {fmt(duration)}
                </time>

                {/* Idle dim control */}
                {mode === 'idle' && (
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#fff',
                      fontSize: 12,
                      marginLeft: 6,
                    }}
                    title="Background darkness when paused"
                  >
                    Dim
                    <input
                      type="range"
                      min={0}
                      max={0.6}
                      step={0.02}
                      value={idleDim}
                      onChange={(e) => setIdleDim(Number(e.currentTarget.value))}
                      style={{ width: 120 }}
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

const pillBtn: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,.22)',
  background: 'rgba(0,0,0,.35)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

function fmt(n: number) {
  if (!Number.isFinite(n)) return '0:00';
  const m = Math.floor(n / 60);
  const s = Math.floor(n % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}
