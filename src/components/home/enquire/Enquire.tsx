'use client';

import { useModals } from '../modals/ModalContext';
import EnquireModal from './EnquireModal';
import styles from './Enquire.module.scss';

export default function Enquire() {
  const { openEnquire } = useModals();

  return (
    <>
      <section id="enquire" className={styles.section} aria-labelledby="enquire-heading">
        <div className={styles.inner}>
          <p className={styles.kicker}>For venues &amp; events</p>
          <h2 id="enquire-heading" className={styles.title}>
            Enquire about DJs and live music.
          </h2>
          <p className={styles.lead}>
            We curate DJs and musicians for restaurants, bars and event spaces — matching artists to
            your brand, guest profile and schedule.
          </p>

          <button type="button" className={styles.cta} onClick={openEnquire}>
            Open enquiry form
          </button>
        </div>
      </section>

      {/* Mount the modal here; it only shows when open === 'enquire' */}
      <EnquireModal />
    </>
  );
}
