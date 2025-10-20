// src/components/navbar/NavVariantContext.tsx
'use client';
import { createContext, useContext } from 'react';
import type { NavSlug } from './registry';

type Ctx = { slug: NavSlug; setSlug: (s: NavSlug) => void; preview: boolean };
const NavVariantContext = createContext<Ctx | null>(null);

export const useNavVariant = () => {
  const ctx = useContext(NavVariantContext);
  if (!ctx) throw new Error('useNavVariant must be used within <NavVariantProvider>');
  return ctx;
};

export function NavVariantProvider({ value, children }: { value: Ctx; children: React.ReactNode }) {
  return <NavVariantContext.Provider value={value}>{children}</NavVariantContext.Provider>;
}
