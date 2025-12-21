// src/components/admin/home/HeroSettings.tsx
'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import styles from './HeroSettings.module.scss';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { humanUploadError } from '@/utils/uploadErrors';

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
  title: 'Bringing nightlife to life.',
  description:
    'We’re a curated collective of DJs and musicians crafting atmosphere-first experiences — from soulful acoustics to floor-filling sets. We deliver sound that fits the room, the guests, and the brand.',
  ctaText: 'ENQUIRE NOW',
  ctaHref: '#enquire',
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
        // keep defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** SAFE helpers – read value before calling setForm so we don’t close over the event */
  const onText =
    <K extends keyof HeroForm>(key: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.currentTarget.value as HeroForm[K];
      setForm((f) => ({ ...f, [key]: value }));
    };

  const onSelect =
    <K extends keyof HeroForm>(key: K) =>
    (e: ChangeEvent<HTMLSelectElement>) => {
      const value = e.currentTarget.value as HeroForm[K];
      setForm((f) => ({ ...f, [key]: value }));
    };

  const onOverlay = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.currentTarget.value);
    const n = Number.isNaN(raw) ? 0 : raw;
    setForm((f) => ({
      ...f,
      overlayDarkness: Math.max(0, Math.min(1, n)),
    }));
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
      <p>Update the home page hero media, overlay and text.</p>

      <div className={styles.form}>
        {/* ========= QUICK CONTROLS ========= */}
        <div className={styles.group}>
          <div className={styles.groupHeader}>
            <h3>Hero basics</h3>
            <p>Choose your media type and how dark the overlay should be.</p>
          </div>

          <div className={styles.groupGrid}>
            <label>
              Media Type
              <select value={form.mediaType} onChange={onSelect('mediaType')}>
                <option value="VIDEO">Video</option>
                <option value="IMAGE">Image</option>
              </select>
              <small>Video works best for 10–15s loops.</small>
            </label>

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
              <small>0 = no overlay (bright), 1 = fully dark (text very strong).</small>
            </label>
          </div>
        </div>

        {/* ========= TEXT CONTENT ========= */}
        <div className={styles.group}>
          <div className={styles.groupHeader}>
            <h3>Headline & copy</h3>
            <p>Keep it short and punchy. This is what visitors read first.</p>
          </div>

          <div className={styles.groupGrid}>
            <label className={styles.full}>
              Heading (subtitle under kicker)
              <input
                value={form.title}
                onChange={onText('title')}
                placeholder="Bringing nightlife to life."
              />
            </label>

            <label className={styles.full}>
              Paragraph
              <textarea rows={4} value={form.description} onChange={onText('description')} />
            </label>
          </div>
        </div>

        {/* ========= CTA ========= */}
        <div className={styles.group}>
          <div className={styles.groupHeader}>
            <h3>Call to action</h3>
            <p>Where do you want people to go from the hero?</p>
          </div>

          <div className={styles.groupGrid}>
            <label>
              CTA Text
              <input value={form.ctaText} onChange={onText('ctaText')} placeholder="ENQUIRE NOW" />
            </label>
            <label>
              CTA Link
              <input value={form.ctaHref} onChange={onText('ctaHref')} placeholder="#enquire" />
              <small>Use a section ID (e.g. #enquire) or full URL.</small>
            </label>
          </div>
        </div>

        {/* ========= MEDIA ========= */}
        <div className={styles.group}>
          <div className={styles.groupHeader}>
            <h3>Media files</h3>
            <p>Upload once and reuse. We&apos;ll pull from the media library automatically.</p>
          </div>

          {form.mediaType === 'VIDEO' ? (
            <div className={styles.groupGrid}>
              <label className={styles.full}>
                Video URL
                <input
                  placeholder="/assets/hero.mp4"
                  value={form.videoSrc || ''}
                  onChange={onText('videoSrc')}
                />
                <div className={styles.uploaderRow}>
                  <UploadButton<OurFileRouter, 'videoUploader'>
                    endpoint="videoUploader"
                    onClientUploadComplete={(res) => {
                      const u = (res?.[0]?.ufsUrl ?? res?.[0]?.url ?? '').trim();
                      if (u) setForm((prev) => ({ ...prev, videoSrc: u }));
                    }}
                    onUploadError={(err) => alert(humanUploadError(err, 'video'))}
                  />
                  <small>Upload MP4/MOV (10–15s loop recommended).</small>
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
                  <UploadButton<OurFileRouter, 'imageUploader'>
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      const u = (res?.[0]?.ufsUrl ?? res?.[0]?.url ?? '').trim();
                      if (u) setForm((prev) => ({ ...prev, posterSrc: u }));
                    }}
                    onUploadError={(err) => alert(humanUploadError(err, 'image'))}
                  />
                  <small>Poster/thumbnail image (JPG/PNG/WebP).</small>
                </div>
              </label>
            </div>
          ) : (
            <div className={styles.groupGrid}>
              <label className={styles.full}>
                Image URL
                <input
                  placeholder="/assets/hero.png"
                  value={form.imageSrc}
                  onChange={onText('imageSrc')}
                />
                <div className={styles.uploaderRow}>
                  <UploadButton<OurFileRouter, 'imageUploader'>
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      const u = (res?.[0]?.ufsUrl ?? res?.[0]?.url ?? '').trim();
                      if (u) setForm((prev) => ({ ...prev, imageSrc: u }));
                    }}
                    onUploadError={(err) => alert(humanUploadError(err, 'image'))}
                  />
                  <small>Upload a high-contrast hero image (images only).</small>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* ========= ACTIONS ========= */}
        <div className={styles.actions}>
          <button className={styles.save} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save hero'}
          </button>
        </div>
      </div>

      <p className={styles.tip}>
        Tip: after saving, refresh the Home page to see changes instantly.
      </p>
    </section>
  );
}
