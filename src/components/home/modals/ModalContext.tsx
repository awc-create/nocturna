'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type ModalName = 'enquire' | 'join' | 'contact' | null;

type ModalContextValue = {
  open: ModalName;
  openEnquire: () => void;
  openJoin: () => void;
  openContact: () => void;
  close: () => void;
};

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<ModalName>(null);

  const openEnquire = useCallback(() => setOpen('enquire'), []);
  const openJoin = useCallback(() => setOpen('join'), []);
  const openContact = useCallback(() => setOpen('contact'), []);
  const close = useCallback(() => setOpen(null), []);

  // 🔒 Lock body scroll when any modal is open
  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      return;
    }

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <ModalContext.Provider value={{ open, openEnquire, openJoin, openContact, close }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModals(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModals must be used within a ModalProvider');
  }
  return ctx;
}
