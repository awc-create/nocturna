// src/components/navbar/Navbar.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/config/menu.config';
import styles from './Navbar.module.scss';

const NAV_H = 70; // increased from 56px → taller pill
const HANDOFF_SPAN = 80; // extended handoff for smoother animation
const HIDE_EXTRA = 22; // extra pixels to fully clear
const RANGE = 160; // scroll px for morph

type CSSVars = React.CSSProperties & { [key: `--${string}`]: string | number };

export default function Navbar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const [handoff, setHandoff] = useState(0);
  const [morph, setMorph] = useState(0);
  const [hover, setHover] = useState(false);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const footer: HTMLElement | null =
      document.getElementById('site-footer') ||
      (document.querySelector('[role="contentinfo"]') as HTMLElement | null) ||
      (document.querySelector('footer') as HTMLElement | null);

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    const compute = () => {
      let p = 0;
      if (footer) {
        const viewportBottom = window.innerHeight;
        const footerTop = footer.getBoundingClientRect().top;
        const overlap = Math.max(0, viewportBottom - footerTop);
        const TOTAL = NAV_H + HANDOFF_SPAN;
        p = clamp(overlap / TOTAL, 0, 1);
      }
      setHandoff(p);

      const y = window.scrollY || 0;
      setMorph(clamp(y / RANGE, 0, 1));
    };

    const onScrollOrResize: EventListener = () => {
      if (rafId.current != null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        compute();
      });
    };

    compute();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    let ro: ResizeObserver | null = null;
    if (footer && 'ResizeObserver' in window) {
      ro = new ResizeObserver(() => compute());
      ro.observe(footer);
    }

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (ro) ro.disconnect();
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const HIDE_PX = NAV_H + HIDE_EXTRA;
  const bottomStyle = { transform: `translateY(${handoff * HIDE_PX}px)` };
  const topStyle = { transform: `translateY(${-HIDE_PX + handoff * HIDE_PX}px)` };

  const m = hover ? 0 : morph;

  const linksStyle: CSSVars = {
    opacity: 1 - m,
    scale: (1 - 0.06 * m) as number,
    filter: `blur(${2 * m}px)`,
    '--gap': `${16 * (1 - m)}px`,
    '--letter': `${0.015 * (1 - m)}em`,
    pointerEvents: m > 0.6 ? 'none' : 'auto',
  };

  const logoStyle: React.CSSProperties = {
    opacity: m,
    transform: `translateY(var(--logo-nudge, 0px)) scale(${0.9 + 0.1 * m})`,
  };

  const pillVars: CSSVars = { ['--links-count']: NAV_LINKS.length };

  const CenterMorph = () => (
    <div className={styles.centerStack} aria-hidden={false}>
      {/* Centered logo */}
      <div className={styles.logoLayer} style={logoStyle} aria-hidden={hover || m === 0}>
        <Link href="/" className={styles.logoLink} aria-label="Home">
          <Image src="/assets/footer-light.png" alt="" width={45} height={45} priority />
        </Link>
      </div>

      {/* Links */}
      <div className={styles.linksLayer} style={linksStyle}>
        {NAV_LINKS.map(({ slug, label }) => {
          const href = `/${slug}`;
          return (
            <Link
              key={slug}
              href={href}
              className={`${styles.link} ${isActive(href) ? styles.active : ''}`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );

  const Pill = () => (
    <nav
      className={styles.shell}
      style={pillVars}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={styles.left} />
      <div className={styles.right} />
      <CenterMorph />
    </nav>
  );

  return (
    <>
      <div className={styles.topWrapper} style={topStyle}>
        <Pill />
      </div>

      <div className={styles.bottomWrapper} style={bottomStyle}>
        <Pill />
      </div>
    </>
  );
}
