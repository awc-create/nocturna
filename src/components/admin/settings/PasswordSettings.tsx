'use client';

import { useState } from 'react';
import styles from './PasswordSettings.module.scss';

export default function PasswordSettings() {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (newPassword.length < 8) return alert('New password must be at least 8 characters.');
    if (newPassword !== confirmPassword)
      return alert('New password and confirmation do not match.');

    setSaving(true);
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) throw new Error(await res.text());

      alert('Password updated.');
      setCurrent('');
      setNew('');
      setConfirm('');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.section}>
      <h3>Password</h3>
      <p>Change your admin password. You’ll need your current password.</p>

      <div className={styles.form}>
        <label className={styles.full}>
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>

        <label className={styles.full}>
          New password
          <input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} />
          <small>Minimum 8 characters recommended.</small>
        </label>

        <label className={styles.full}>
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>

        <div className={styles.actions}>
          <button className={styles.save} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save password'}
          </button>
        </div>
      </div>
    </section>
  );
}
