// src/components/admin/home/HeroSettings.tsx
'use client';

import { useEffect, useState } from 'react';
import styles from './HeroSettings.module.scss';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

type MediaType = 'VIDEO' | 'IMAGE';

type HeroForm = {
  mediaType: MediaType;
  imageSrc: string;
  videoSrc?: string | null;
  posterSrc?: string | null;
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  overlayDarkness: number;
};

const DEFAULTS: HeroForm = {
  mediaType: 'VIDEO',
  imageSrc: '/assets/hero.png',
  videoSrc: '/assets/hero.mp4',
  posterSrc: '/assets/hero-poster.jpg',
  title: 'Your Modern Website Starts Here',
  description:
    'Crafted with performance and style in mind. This is your launchpad for a fast, clean, and responsive online presence — proudly created with the Web Dev Wizard CLI.',
  ctaText: 'APPLY FOR MEMBERSHIP',
  ctaHref: '/apply',
  overlayDarkness: 0.5,
};

export default function HeroSettings() {
  const [form, setForm] = useState<HeroForm>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/hero', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load hero');
        const data = (await res.json()) as Partial<HeroForm>;
        setForm({ ...DEFAULTS, ...data });
      } catch {
        /* keep defaults */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onText =
    <K extends keyof HeroForm>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.currentTarget.value as HeroForm[K] }));
    };

  const onSelect =
    <K extends keyof HeroForm>(key: K) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.currentTarget.value as HeroForm[K] }));
    };

  const onOverlay = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.currentTarget.value);
    setForm((f) => ({ ...f, overlayDarkness: Math.max(0, Math.min(1, n)) }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/home/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      alert('Hero updated! Refresh Home to see changes.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error saving hero.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.section}>
        <h2>Home Hero</h2>
        <p>Loading current hero content…</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2>Home Hero</h2>
      <p>Update the home page hero media and text.</p>

      <div className={styles.form}>
        {/* Media type */}
        <label>
          Media Type
          <select value={form.mediaType} onChange={onSelect('mediaType')}>
            <option value="VIDEO">Video</option>
            <option value="IMAGE">Image</option>
          </select>
        </label>

        {/* Title / Description */}
        <label>
          Heading (subtitle under kicker)
          <input value={form.title} onChange={onText('title')} />
        </label>

        <label className={styles.full}>
          Paragraph
          <textarea rows={4} value={form.description} onChange={onText('description')} />
        </label>

        {/* CTA */}
        <label>
          CTA Text
          <input value={form.ctaText} onChange={onText('ctaText')} />
        </label>
        <label>
          CTA Link
          <input value={form.ctaHref} onChange={onText('ctaHref')} />
        </label>

        {/* Media-specific */}
        {form.mediaType === 'VIDEO' ? (
          <>
            <label className={styles.full}>
              Video URL
              <input
                placeholder="/assets/hero.mp4"
                value={form.videoSrc || ''}
                onChange={onText('videoSrc')}
              />
              <div className={styles.uploaderRow}>
                <UploadButton<OurFileRouter, 'mediaUploader'>
                  endpoint="mediaUploader"
                  onClientUploadComplete={(res) => {
                    // Use CDN url supplied by UploadThing
                    const u = res?.[0]?.url;
                    if (u) setForm((prev) => ({ ...prev, videoSrc: u }));
                  }}
                  onUploadError={(err) => {
                    const msg = err instanceof Error ? err.message : 'Upload failed';
                    alert(msg);
                  }}
                />
                <small>Upload .mp4 (10–15s loop recommended)</small>
              </div>
            </label>

            <label className={styles.full}>
              Poster Image URL (optional)
              <input
                placeholder="/assets/hero-poster.jpg"
                value={form.posterSrc || ''}
                onChange={onText('posterSrc')}
              />
              <div className={styles.uploaderRow}>
                <UploadButton<OurFileRouter, 'mediaUploader'>
                  endpoint="mediaUploader"
                  onClientUploadComplete={(res) => {
                    const u = res?.[0]?.url;
                    if (u) setForm((prev) => ({ ...prev, posterSrc: u }));
                  }}
                  onUploadError={(err) => {
                    const msg = err instanceof Error ? err.message : 'Upload failed';
                    alert(msg);
                  }}
                />
                <small>Upload poster image</small>
              </div>
            </label>
          </>
        ) : (
          <label className={styles.full}>
            Image URL
            <input
              placeholder="/assets/hero.png"
              value={form.imageSrc}
              onChange={onText('imageSrc')}
            />
            <div className={styles.uploaderRow}>
              <UploadButton<OurFileRouter, 'mediaUploader'>
                endpoint="mediaUploader"
                onClientUploadComplete={(res) => {
                  const u = res?.[0]?.url;
                  if (u) setForm((prev) => ({ ...prev, imageSrc: u }));
                }}
                onUploadError={(err) => {
                  const msg = err instanceof Error ? err.message : 'Upload failed';
                  alert(msg);
                }}
              />
              <small>Upload hero image</small>
            </div>
          </label>
        )}

        {/* Overlay */}
        <label>
          Overlay Darkness ({form.overlayDarkness.toFixed(2)})
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={form.overlayDarkness}
            onChange={onOverlay}
          />
        </label>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.save} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <p style={{ marginTop: 10, color: '#6b7280', fontSize: '.9rem' }}>
        Tip: after saving, refresh the Home page to see changes instantly.
      </p>
    </section>
  );
}
