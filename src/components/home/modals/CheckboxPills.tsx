// src/components/home/modals/CheckboxPills.tsx
'use client';

import styles from './CheckboxPills.module.scss';

type Props = {
  name: string;
  value: string; // stored as "opt1,opt2"
  options: string[];
  required?: boolean;
  onChange: (value: string) => void;
};

function parseCsv(v: string) {
  return v
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function CheckboxPills({ name, value, options, required = false, onChange }: Props) {
  const selected = new Set(parseCsv(value));

  const toggle = (opt: string) => {
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onChange(Array.from(next).join(','));
  };

  const selectedCount = selected.size;

  return (
    <div className={styles.group} role="group" aria-label={name}>
      {/* ✅ Hidden required hook:
          If required, enforce "at least one selected" via a hidden required input.
          (Works with native form validation if you ever rely on it.) */}
      {required && (
        <input
          className={styles.srOnly}
          tabIndex={-1}
          aria-hidden="true"
          required
          value={selectedCount > 0 ? '1' : ''}
          onChange={() => {}}
        />
      )}

      {options.map((opt) => {
        const active = selected.has(opt);

        return (
          <button
            key={opt}
            type="button"
            className={`${styles.pill} ${active ? styles.active : ''}`}
            aria-pressed={active}
            onClick={() => toggle(opt)}
          >
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.text}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
