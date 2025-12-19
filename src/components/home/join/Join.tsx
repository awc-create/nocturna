// src/components/home/join/Join.tsx
'use client';

import { useModals } from '../modals/ModalContext';
import JoinModal from './JoinModal';
import styles from './Join.module.scss';

export default function Join() {
  const { openJoin } = useModals();

  return (
    <>
      <section id="join" className={styles.section} aria-labelledby="join-heading">
        <div className={styles.inner}>
          <p className={styles.kicker}>For artists</p>
          <h2 id="join-heading" className={styles.title}>
            Join the Nocturna roster.
          </h2>
          <p className={styles.lead}>
            We work with DJs and musicians who care about atmosphere, not just tracklists. If you
            love reading the room and playing premium spaces, we’d love to hear from you.
          </p>

          <button type="button" className={styles.cta} onClick={openJoin}>
            Apply to join
          </button>
        </div>
      </section>

      {/* Join modal lives here */}
      <JoinModal />
    </>
  );
}
