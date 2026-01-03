// src/components/home/modals/FieldShell.tsx
'use client';

import styles from './FieldShell.module.scss';

export default function FieldShell({
  label,
  required,
  helpText,
  children,
}: {
  label: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <div className={styles.labelRow}>
        <div className={styles.label}>
          {label} {required ? <span className={styles.req}>*</span> : null}
        </div>
        {helpText ? <div className={styles.help}>{helpText}</div> : null}
      </div>

      <div className={styles.control}>{children}</div>
    </div>
  );
}
