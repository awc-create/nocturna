// src/components/home/hero/Hero.tsx
'use client';

import Head from 'next/head';
import React, { useEffect, useRef, useState } from 'react';
import styles from './Hero.module.scss';
import { FaChevronDown } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';

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
};

const FALLBACK: HeroConfig = {
  mediaType: 'IMAGE',
  imageSrc: '',
  videoSrc: null,
  posterSrc: null,
  title: 'Your Modern Website Starts Here',
  description:
    'Crafted with performance and style in mind. This is your launchpad for a fast, clean, and responsive online presence — proudly created with the Web Dev Wizard CLI.',
  ctaText: 'ENQUIRE NOW',
  ctaHref: '/apply',
  overlayDarkness: 0.5,
};

export default function Hero() {
  const chevronRef = useRef<HTMLButtonElement | null>(null);
  const [cfg, setCfg] = useState<HeroConfig>(FALLBACK);

  useEffect(() => {
    const btn = chevronRef.current;
    if (!btn) return;
    const onClick = () => {
      const next = document.querySelector('[data-section="after-hero"]') || document.body;
      const y = (next as HTMLElement).getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    };
    btn.addEventListener('click', onClick);
    return () => btn.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/home/hero', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<HeroConfig>;
        if (mounted) setCfg({ ...FALLBACK, ...data });
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const darkness = Math.min(1, Math.max(0, cfg.overlayDarkness ?? 0.5));
  const hasVideo = cfg.mediaType === 'VIDEO' && !!cfg.videoSrc;
  const hasImage = cfg.mediaType === 'IMAGE' && !!cfg.imageSrc;
  const hasMedia = hasVideo || hasImage;

  return (
    <>
      <Head>
        {cfg.posterSrc ? <link rel="preload" href={cfg.posterSrc} as="image" /> : null}
        {hasVideo ? <link rel="preload" href={cfg.videoSrc!} as="video" /> : null}
      </Head>

      <header className={styles.hero} role="banner" aria-label="Homepage hero">
        <div className={`${styles.media} ${!hasMedia ? styles.noMedia : ''}`} aria-hidden="true">
          {hasVideo ? (
            <video
              className={styles.video}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={cfg.posterSrc || undefined}
            >
              <source src={cfg.videoSrc!} type="video/mp4" />
            </video>
          ) : hasImage ? (
            <Image
              src={cfg.imageSrc}
              alt=""
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            // no media → CSS-only background via .noMedia
            <div className={styles.fallbackBg} />
          )}
        </div>

        {/* Adjustable overlay still applies to fallback */}
        <div
          className={styles.overlay}
          aria-hidden="true"
          style={{
            background:
              `linear-gradient(to bottom, rgba(0,0,0,${darkness * 0.9}) 0%, rgba(0,0,0,${darkness}) 40%, rgba(0,0,0,${Math.min(1, darkness + 0.05)}) 100%),` +
              `radial-gradient(100% 60% at 50% 20%, rgba(0,0,0,${darkness * 0.6}), transparent 60%)`,
          }}
        />

        <div className={styles.content}>
          <h1 className={styles.kicker}>
            <span className={styles.badge}>WELCOME TO</span> NOCTURNA
          </h1>
          <p className={styles.subtitle}>{cfg.title}</p>
          <p className={styles.tagline}>{cfg.description}</p>
          <div className={styles.actions}>
            <Link href={cfg.ctaHref} className={styles.ctaPrimary}>
              {cfg.ctaText}
            </Link>
          </div>
        </div>

        <button ref={chevronRef} className={styles.scrollDown} aria-label="Scroll to content">
          <FaChevronDown />
        </button>
      </header>
    </>
  );
}
