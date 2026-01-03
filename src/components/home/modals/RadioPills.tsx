// src/components/home/modals/RadioPills.tsx
'use client';

import styles from './RadioPills.module.scss';

type Props = {
  name: string;
  value: string;
  options: string[];
  required?: boolean;
  onChange: (value: string) => void;
};

export default function RadioPills({ name, value, options, required = false, onChange }: Props) {
  return (
    <div className={styles.group} role="radiogroup" aria-label={name}>
      {/* ✅ Hidden required field hook (so native form validation can still work if you use it) */}
      {required && (
        <input
          className={styles.srOnly}
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
        />
      )}

      {options.map((opt) => {
        const active = value === opt;

        return (
          <button
            key={opt}
            type="button"
            className={`${styles.pill} ${active ? styles.active : ''}`}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
          >
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.text}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
