'use client';

import styles from './sky.module.scss';

export default function SkyOverlay() {
  return (
    <>
      {/* PAGE-HEIGHT BLUE DRIFT */}
      <div className={styles.skyOverlay} aria-hidden="true" />

      {/* SOFT ATMOSPHERE */}
      <div className={styles.skyGlow} aria-hidden="true" />
    </>
  );
}
