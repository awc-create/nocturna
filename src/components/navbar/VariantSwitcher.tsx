// src/components/navbar/VariantSwitcher.tsx
'use client';

import { useEffect, useState } from 'react';
import { useNavVariant } from './NavVariantContext';
import { NAV_ORDER, NAV_REGISTRY, type NavSlug } from './registry';
import styles from './variant-switcher.module.scss';

type Props = { className?: string };

export default function VariantSwitcher({ className }: Props) {
  const { slug, setSlug } = useNavVariant();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // hydration-safe

  return (
    <div className={`${styles.switcher} ${className ?? ''}`}>
      <select
        aria-label="Switch navbar variant"
        value={slug}
        onChange={(e) => setSlug(e.target.value as NavSlug)}
      >
        {NAV_ORDER.map((s) => (
          <option key={s} value={s}>
            {NAV_REGISTRY[s].label}
          </option>
        ))}
      </select>
    </div>
  );
}
