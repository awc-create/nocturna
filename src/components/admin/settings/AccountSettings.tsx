'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import styles from './AccountSettings.module.scss';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { humanUploadError } from '@/utils/uploadErrors';

type Role = 'admin' | 'user';

type Me = {
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
};

const FALLBACK_AVATAR = '/assets/A_W.png';
const FALLBACK_NAME = 'Alex';

function normalizeName(v: string | null | undefined) {
  const t = (v ?? '').trim();
  return t || FALLBACK_NAME;
}

function normalizeImage(v: string | null | undefined) {
  const t = (v ?? '').trim();
  return t || FALLBACK_AVATAR;
}

export default function AccountSettings() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState(FALLBACK_NAME);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const avatarSrc = useMemo(() => normalizeImage(me?.image), [me?.image]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const res = await fetch('/api/admin/me', { cache: 'no-store' });
      if (!res.ok) return;

      const data = (await res.json()) as Me;
      if (!mounted) return;

      const next: Me = {
        ...data,
        name: normalizeName(data.name),
        image: data.image ?? null,
      };

      setMe(next);
      setName(next.name ?? FALLBACK_NAME);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const saveProfile = async (patch: { name?: string; image?: string | null }) => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/admin/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'profile', ...patch }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to save profile');
      }

      const updated = (await res.json()) as Me;
      const next: Me = {
        ...updated,
        name: normalizeName(updated.name),
        image: updated.image ?? null,
      };

      setMe(next);
      setName(next.name ?? FALLBACK_NAME);

      // ✅ Tell AdminClient to refetch/update top bar immediately
      window.dispatchEvent(new Event('admin:me-updated'));
    } finally {
      setSavingProfile(false);
    }
  };

  const submitName = async () => {
    const next = name.trim() || FALLBACK_NAME;
    await saveProfile({ name: next });
    alert('Profile updated.');
  };

  const submitPassword = async () => {
    setSavingPwd(true);
    try {
      const res = await fetch('/api/admin/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'password',
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to change password');
      }

      setCurrentPassword('');
      setNewPassword('');

      // ✅ optional, but keeps UI consistent
      window.dispatchEvent(new Event('admin:me-updated'));

      alert('Password updated.');
    } finally {
      setSavingPwd(false);
    }
  };

  if (!me) {
    return (
      <section className={styles.section}>
        <h2>Account</h2>
        <p>Loading profile…</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2>Account</h2>
      <p>Update your display name, profile photo, and password.</p>

      <div className={styles.grid}>
        {/* PROFILE CARD */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Profile</h3>
            <p>Shown in the admin top bar.</p>
          </div>

          <div className={styles.profileRow}>
            <div className={styles.avatarWrap}>
              <Image
                src={avatarSrc}
                alt="Profile avatar"
                fill
                sizes="52px"
                className={styles.avatarImg}
                priority
              />
            </div>

            <div className={styles.profileMeta}>
              <strong>{normalizeName(me.name)}</strong>
              <small>{me.email}</small>
            </div>
          </div>

          <div className={styles.form}>
            <label className={styles.full}>
              Display name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" />
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.save}
                onClick={submitName}
                disabled={savingProfile}
              >
                {savingProfile ? 'Saving…' : 'Save name'}
              </button>
            </div>
          </div>

          <div className={styles.uploaderBlock}>
            <div className={styles.uploaderTop}>
              <strong>Profile photo</strong>
              <small>Upload a square image (recommended).</small>
            </div>

            <div className={styles.uploaderRow}>
              {/* ✅ Images only → clearer errors if someone tries to upload a video */}
              <UploadButton<OurFileRouter, 'imageUploader'>
                endpoint="imageUploader"
                className={styles.utButton}
                appearance={{
                  button: styles.utButton,
                  container: styles.utContainer,
                  allowedContent: styles.utAllowed,
                }}
                onClientUploadComplete={(res) => {
                  const u = (res?.[0]?.ufsUrl ?? res?.[0]?.url ?? '').trim();
                  if (!u) return;

                  // Optimistic UI
                  setMe((prev) => (prev ? { ...prev, image: u } : prev));
                  void saveProfile({ image: u });
                }}
                onUploadError={(err) => alert(humanUploadError(err, 'image'))}
              />

              <button
                type="button"
                className={styles.ghost}
                onClick={() => saveProfile({ image: null })}
                disabled={savingProfile}
              >
                Remove photo
              </button>
            </div>

            <small className={styles.hint}>
              If no photo is set, we’ll fall back to <code>/assets/A_W.png</code>.
            </small>
          </div>
        </div>

        {/* PASSWORD CARD */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Password</h3>
            <p>Change the login password for this admin account.</p>
          </div>

          <div className={styles.form}>
            <label className={styles.full}>
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>

            <label className={styles.full}>
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.save}
                onClick={submitPassword}
                disabled={savingPwd}
              >
                {savingPwd ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </div>

          <small className={styles.hint}>
            Tip: after changing password, you may need to sign out and back in.
          </small>
        </div>
      </div>
    </section>
  );
}
