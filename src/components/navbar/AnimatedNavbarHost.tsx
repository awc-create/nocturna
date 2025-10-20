// src/components/navbar/AnimatedNavbarHost.tsx
'use client';

import { useEffect, useState } from 'react';
import { NAV_REGISTRY, DEFAULT_NAV, type NavSlug } from './registry';
import { AnimatePresence, motion } from 'framer-motion';
import { NavVariantProvider } from './NavVariantContext';

function getPreviewEnabled() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('navPreview') === '1';
}

export default function AnimatedNavbarHost({ initialSlug }: { initialSlug: NavSlug }) {
  const [slug, setSlug] = useState<NavSlug>(initialSlug);
  const preview = getPreviewEnabled();

  // hydrate from cookie on mount
  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )nav_variant=([^;]*)/);
    const c = (m ? decodeURIComponent(m[1]) : '') as NavSlug;
    if (c && NAV_REGISTRY[c]) setSlug(c);
  }, []);

  // persist when changed
  useEffect(() => {
    void fetch('/api/nav-choose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    });
  }, [slug]);

  const Entry = NAV_REGISTRY[slug] ?? NAV_REGISTRY[DEFAULT_NAV];
  const NavbarComp = Entry.component;

  return (
    <NavVariantProvider value={{ slug, setSlug, preview }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={slug}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <NavbarComp />
        </motion.div>
      </AnimatePresence>
    </NavVariantProvider>
  );
}
