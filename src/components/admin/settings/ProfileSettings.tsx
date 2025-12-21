'use client';

import { useState } from 'react';
import styles from './ProfileSettings.module.scss';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { humanUploadError } from '@/utils/uploadErrors';

type Props = {
  initial: { email: string; name: string; image: string | null };
  onUpdated: (next: { email: string; name: string; image: string | null }) => void;
};

export default function ProfileSettings({ initial, onUpdated }: Props) {
  const [name, setName] = useState(initial.name ?? '');
  const [image, setImage] = useState<string | null>(initial.image ?? null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image }),
      });
      if (!res.ok) throw new Error(await res.text());

      const next = (await res.json()) as { email: string; name: string; image: string | null };
      onUpdated(next);

      // Ensures topbar badge reflects changes
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.section}>
      <h3>Profile</h3>
      <p>Update your display name and avatar.</p>

      <div className={styles.form}>
        <label className={styles.full}>
          Display name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Admin" />
        </label>

        <div className={styles.avatarRow}>
          <div className={styles.preview}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="Profile preview" />
            ) : (
              <div className={styles.fallback}>No image</div>
            )}
          </div>

          <div className={styles.avatarActions}>
            <label className={styles.full}>
              Image URL
              <input
                value={image ?? ''}
                onChange={(e) => setImage(e.target.value || null)}
                placeholder="https://..."
              />
            </label>

            <div className={styles.uploader}>
              {/* ✅ Images only, and friendlier error messages */}
              <UploadButton<OurFileRouter, 'imageUploader'>
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  const u = (res?.[0]?.ufsUrl ?? res?.[0]?.url ?? '').trim();
                  if (u) setImage(u);
                }}
                onUploadError={(err) => alert(humanUploadError(err, 'image'))}
              />
              <small>Upload a square image for best results.</small>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.save} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>
    </section>
  );
}
