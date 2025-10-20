'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useMotionValueEvent, type Variants } from 'motion/react';
import { NAV_LINKS } from '@/config/menu.config';
import VariantSwitcher from '../VariantSwitcher';
import styles from './scroll-peek.module.scss';

const THRESHOLD = 32; // scroll px before toggling
const HIDE_DELAY = 1000; // ms

export default function ScrollPeekNavbar() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const lastYRef = useRef(0);

  // --- hide-timer management ---
  const hideTimer = useRef<number | null>(null);
  const cancelHide = () => {
    if (hideTimer.current != null) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };
  const scheduleHide = () => {
    cancelHide();
    hideTimer.current = window.setTimeout(() => setHidden(true), HIDE_DELAY);
  };
  useEffect(() => () => cancelHide(), []); // cleanup

  // --- scroll behavior ---
  useMotionValueEvent(scrollY, 'change', (y) => {
    const diff = y - lastYRef.current; // +down, -up
    if (Math.abs(diff) < THRESHOLD) return;

    if (diff > 0) {
      // scrolling down -> hide immediately
      cancelHide();
      setHidden(true);
    } else {
      // scrolling up -> show immediately
      cancelHide();
      setHidden(false);
    }
    lastYRef.current = y;
  });

  const variants: Variants = {
    visible: { y: '0%' },
    hidden: { y: '-95%' },
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // helpers for hover/focus interactions
  const onEnter = () => {
    cancelHide();
    setHidden(false);
  };
  const onLeave = () => scheduleHide();
  const onFocusWithin = () => {
    cancelHide();
    setHidden(false);
  };
  const onBlurAll = () => scheduleHide();

  return (
    <>
      {/* Sliding pill */}
      <motion.header
        className={styles.wrapper}
        animate={hidden ? 'hidden' : 'visible'}
        initial="visible"
        variants={variants}
        transition={{ duration: 0.2 }}
      >
        <nav
          className={styles.shell}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          onFocus={onFocusWithin}
          onBlur={onBlurAll}
        >
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <Image src="/assets/footer-light.png" alt="Logo" width={36} height={36} />
            <span className={styles.brand}>Your Brand</span>
          </Link>

          {/* Links */}
          <div className={styles.links}>
            {NAV_LINKS.map(({ slug, label }) => {
              const href = `/${slug}`;
              return (
                <Link key={slug} href={href} className={isActive(href) ? styles.active : ''}>
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Always-on variant dropdown */}
          <VariantSwitcher className={styles.switcher} />
        </nav>
      </motion.header>

      {/* Centered logo handle (shows only when nav is hidden) */}
      <motion.button
        type="button"
        aria-label="Open navigation"
        className={styles.handle}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onFocus={onFocusWithin}
        onBlur={onBlurAll}
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={
          hidden
            ? { opacity: 1, scale: 1, y: 0, pointerEvents: 'auto' }
            : { opacity: 0, scale: 0.98, y: -8, pointerEvents: 'none' }
        }
        transition={{ duration: 0.18 }}
      >
        <Image src="/assets/footer-light.png" alt="Logo" width={28} height={28} />
      </motion.button>
    </>
  );
}
