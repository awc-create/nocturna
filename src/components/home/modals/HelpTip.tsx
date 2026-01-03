'use client';

import { useId, useState } from 'react';
import styles from './HelpTip.module.scss';

type Props = {
  text: string;
  label?: string; // for screen readers
};

export default function HelpTip({ text, label = 'Help' }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className={styles.wrap}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={styles.iBtn}
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)} // mobile tap
        onBlur={() => setOpen(false)} // close when tabbing away
      >
        i
      </button>

      {open && (
        <span id={id} role="tooltip" className={styles.tip}>
          {text}
        </span>
      )}
    </span>
  );
}
