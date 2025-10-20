'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { NAV_LINKS } from '@/config/menu.config';
import VariantSwitcher from '../VariantSwitcher';
import styles from './links-to-logo-morph.module.scss';

/** Scroll distance (px) to go from "links" -> "logo" */
const RANGE = 180;

/** Navbar height must match CSS --nav-height */
const NAV_H = 60;

/** Allow CSS custom props on style objects */
type CSSVars = React.CSSProperties & { [key: `--${string}`]: string | number };

export default function LinksToLogoMorphNavbar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // progress: 0 (top: only links) -> 1 (scrolled: only logo)
  const [progress, setProgress] = useState(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    const compute = () => {
      const y = window.scrollY || 0;
      setProgress(clamp(y / RANGE, 0, 1));
    };

    const onScroll: EventListener = () => {
      if (rafId.current != null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        compute();
      });
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Derived styles from progress
  const linksOpacity = 1 - progress; // 1 → 0
  const linksScale = 1 - 0.06 * progress; // 1 → 0.94
  const linksBlur = 2 * progress; // 0px → 2px
  const gapPx = 18 * (1 - progress); // gap collapses to 0
  const trackLS = 0.02 * (1 - progress); // letter-spacing collapses

  const logoOpacity = progress; // 0 → 1
  const logoScale = 0.88 + 0.12 * progress; // 0.88 → 1.0

  const linksStyle: CSSVars = {
    opacity: linksOpacity,
    scale: linksScale as number, // motion supports numeric scale
    filter: `blur(${linksBlur}px)`,
    '--gap': `${gapPx}px`,
    '--letter': `${trackLS}em`,
    pointerEvents: progress > 0.6 ? 'none' : 'auto',
  };

  return (
    <header className={styles.wrapper} style={{ height: NAV_H }}>
      <nav className={styles.shell}>
        {/* Logo (hidden at top, fades/scales in as you scroll) */}
        <motion.div
          className={styles.logo}
          aria-hidden={progress === 0}
          style={{ opacity: logoOpacity, scale: logoScale }}
        >
          <Link href="/" className={styles.logoLink}>
            <Image src="/assets/footer-light.png" alt="Logo" width={32} height={32} priority />
            <span className={styles.brand}>Your Brand</span>
          </Link>
        </motion.div>

        {/* Links group (only visible at top; collapses and fades on scroll) */}
        <motion.div className={styles.links} style={linksStyle}>
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
        </motion.div>

        {/* Right side: variant dropdown */}
        <div className={styles.right}>
          <VariantSwitcher />
        </div>
      </nav>
    </header>
  );
}
