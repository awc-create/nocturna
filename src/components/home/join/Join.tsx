'use client';

import { useEffect, useState } from 'react';
import { useModals } from '../modals/ModalContext';
import JoinModal from './JoinModal';
import styles from './Join.module.scss';

type JoinConfig = {
  eyebrow: string;
  title: string;
  lead: string;
  buttonLabel: string;
};

const FALLBACK: JoinConfig = {
  eyebrow: 'For artists',
  title: 'Join the Essentia roster.',
  lead: 'We work with DJs and musicians who care about atmosphere, not just tracklists.',
  buttonLabel: 'Apply to join',
};

export default function Join() {
  const { openJoin } = useModals();
  const [cfg, setCfg] = useState<JoinConfig>(FALLBACK);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/join', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<JoinConfig>;
        setCfg({ ...FALLBACK, ...data });
      } catch {
        // ignore
      }
    })();
  }, []);

  return (
    <>
      <section id="join" className={styles.section} aria-labelledby="join-heading">
        <div className={styles.inner}>
          <p className={styles.kicker}>{cfg.eyebrow}</p>
          <h2 id="join-heading" className={styles.title}>
            {cfg.title}
          </h2>
          <p className={styles.lead}>{cfg.lead}</p>

          <button type="button" className={styles.cta} onClick={openJoin}>
            {cfg.buttonLabel}
          </button>
        </div>
      </section>

      <JoinModal />
    </>
  );
}
