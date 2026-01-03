// src/components/home/modals/ModalContext.tsx
'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

// ✅ Import your modals here (adjust paths to your project)
import EnquireModal from '../enquire/EnquireModal';
import JoinModal from '../join/JoinModal';
import ContactModal from '../contact/ContactModal'; // if you have it; otherwise remove

type ModalName = 'enquire' | 'join' | 'contact' | null;

type ModalContextValue = {
  open: ModalName;
  openEnquire: () => void;
  openJoin: () => void;
  openContact: () => void;
  close: () => void;
};

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

function ModalPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(children, document.body);
}

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

  const value = useMemo<ModalContextValue>(
    () => ({ open, openEnquire, openJoin, openContact, close }),
    [open, openEnquire, openJoin, openContact, close]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}

      {/* ✅ This is the fix: modals render at document.body, above everything */}
      <ModalPortal>
        <EnquireModal />
        <JoinModal />
        {/* If you don't have ContactModal yet, delete this line */}
        <ContactModal />
      </ModalPortal>
    </ModalContext.Provider>
  );
}

export function useModals(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModals must be used within a ModalProvider');
  return ctx;
}
