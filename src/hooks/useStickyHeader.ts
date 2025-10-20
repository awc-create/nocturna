// src/hooks/useStickyHeader.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseStickyHeaderProps {
  elRef: React.RefObject<HTMLElement | null>;
  translateBuffer?: number; // extra px above the viewport (default 30)
  speed?: number; // 1 = 1:1 with scroll, <1 slower, >1 faster
}

const QUERY = '(prefers-reduced-motion: no-preference)';

export function useStickyHeader({ elRef, translateBuffer = 30, speed = 1 }: UseStickyHeaderProps) {
  const [prefersReducedMotion, setPRM] = useState(true);
  const prevScrollY = useRef(0);
  const translateYRef = useRef(0); // 0 visible, negative hidden
  const rafId = useRef<number | null>(null);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const step = useCallback(() => {
    const el = elRef.current;
    if (!el) {
      rafId.current = null;
      return;
    }

    const curY = window.scrollY || 0;
    const delta = (curY - prevScrollY.current) * speed; // +down, -up
    prevScrollY.current = curY;

    const maxHide = -((el.offsetHeight || 0) + translateBuffer);
    const next = clamp(
      translateYRef.current + (delta < 0 ? Math.abs(delta) : -Math.abs(delta)),
      maxHide,
      0
    );

    translateYRef.current = next;
    el.style.transform = `translateY(${next}px)`;

    rafId.current = null;
  }, [elRef, translateBuffer, speed]);

  const onScroll = useCallback(() => {
    if (rafId.current != null) return;
    rafId.current = requestAnimationFrame(step);
  }, [step]);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    setPRM(!mql.matches); // true means: reduce motion
    const onChange = (e: MediaQueryListEvent) => setPRM(!e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    prevScrollY.current = window.scrollY || 0;
    translateYRef.current = 0;
    const el = elRef.current;
    if (el) el.style.transform = 'translateY(0px)';

    window.addEventListener('scroll', onScroll, { passive: true });
    const onVis = () => (prevScrollY.current = window.scrollY || 0);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVis);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [prefersReducedMotion, onScroll, elRef]);

  const revealNow = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    translateYRef.current = 0;
    el.style.transform = 'translateY(0px)';
  }, [elRef]);

  return { revealNow };
}
