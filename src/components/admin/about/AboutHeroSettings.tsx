'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from '../home/HeroSettings.module.scss';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import Image from 'next/image';

type HeroForm = {
  mediaType: 'VIDEO' | 'IMAGE';
  imageSrc: string;
  videoSrc?: string | null;
  posterSrc?: string | null;
  loopStartSec?: number;
  loopEndSec?: number;
  startPausedForReturning?: boolean;
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  overlayDarkness: number;
};

type MediaRow = {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  createdAt: string;
};

const DEFAULTS: HeroForm = {
  mediaType: 'VIDEO',
  imageSrc: '/assets/about-hero.jpg',
  videoSrc: '',
  posterSrc: '',
  loopStartSec: 4,
  loopEndSec: 10,
  startPausedForReturning: true,
  title: 'Alex & Alin — Who We Are',
  description:
    'Nocturna curates DJs and live acts to shape atmosphere-first nights for venues and brands.',
  ctaText: 'WORK WITH US',
  ctaHref: '/apply',
  overlayDarkness: 0.55,
};

/* ------------ UploadThing result typing (no any) ------------ */
type UploadThingFileMeta = Readonly<{
  ufsUrl?: string; // preferred public URL
  url?: string; // legacy/deprecated
  name?: string;
  size?: number;
  type?: string;
}>;
function extractPublicUrl(files: unknown): string {
  if (!Array.isArray(files) || files.length === 0) return '';
  const f = files[0] as Partial<UploadThingFileMeta>;
  const u = f.ufsUrl ?? f.url ?? '';
  return typeof u === 'string' ? u : '';
}
/* ------------------------------------------------------------ */

export default function AboutHeroSettings() {
  const [form, setForm] = useState<HeroForm>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<MediaRow[]>([]);
  const [previewKey, setPreviewKey] = useState(0); // force remount preview video
  const previewRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/about/hero', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load hero');
        const data = (await res.json()) as Partial<HeroForm>;
        setForm({ ...DEFAULTS, ...data });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/media?limit=12', { cache: 'no-store' });
        if (res.ok) {
          const rows = (await res.json()) as MediaRow[];
          setUploads(rows);
        }
      } catch {
        /* ignore */
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

  const onNumber =
    <K extends 'loopStartSec' | 'loopEndSec'>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.currentTarget.value);
      setForm((f) => ({ ...f, [key]: Number.isFinite(val) ? val : f[key] }));
    };

  const onCheckbox =
    <K extends 'startPausedForReturning'>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.currentTarget.checked }));
    };

  const onOverlay = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.currentTarget.value);
    setForm((f) => ({ ...f, overlayDarkness: Math.max(0, Math.min(1, n)) }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/about/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      alert('About hero updated! Refresh the About page to see changes.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error saving hero.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const fileHost = useMemo(() => {
    try {
      return form.videoSrc ? new URL(form.videoSrc).host : '';
    } catch {
      return '';
    }
  }, [form.videoSrc]);

  if (loading) {
    return (
      <section className={styles.section}>
        <h2>About Hero</h2>
        <p>Loading current hero content…</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2>About Hero</h2>
      <p>Update the About page hero media and text.</p>

      <div className={styles.form}>
        <label>
          Media Type
          <select value={form.mediaType} onChange={onSelect('mediaType')}>
            <option value="VIDEO">Video</option>
            <option value="IMAGE">Image</option>
          </select>
        </label>

        <label>
          Heading (subtitle under kicker)
          <input value={form.title} onChange={onText('title')} />
        </label>

        <label className={styles.full}>
          Paragraph
          <textarea rows={4} value={form.description} onChange={onText('description')} />
        </label>

        <label>
          CTA Text
          <input value={form.ctaText} onChange={onText('ctaText')} />
        </label>
        <label>
          CTA Link
          <input value={form.ctaHref} onChange={onText('ctaHref')} />
        </label>

        {form.mediaType === 'VIDEO' ? (
          <>
            <label className={styles.full}>
              Video URL
              <input
                placeholder="https://utfs.io/f/… (UploadThing)"
                value={form.videoSrc || ''}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, videoSrc: e.currentTarget.value }));
                  setPreviewKey((k) => k + 1);
                }}
              />
              <div className={styles.uploaderRow}>
                <UploadButton<OurFileRouter, 'mediaUploader'>
                  endpoint="mediaUploader"
                  onClientUploadComplete={(res) => {
                    const u = extractPublicUrl(res);
                    if (u) {
                      setForm((prev) => ({ ...prev, videoSrc: u }));
                      setPreviewKey((k) => k + 1);
                    }
                  }}
                  onUploadError={(err) =>
                    alert(err instanceof Error ? err.message : 'Upload failed')
                  }
                />
                <small>Upload .mp4 (10–20s intro; we’ll loop a segment)</small>
              </div>
            </label>

            <label>
              Loop Start (sec)
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.loopStartSec ?? 0}
                onChange={onNumber('loopStartSec')}
              />
            </label>

            <label>
              Loop End (sec)
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.loopEndSec ?? 0}
                onChange={onNumber('loopEndSec')}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={!!form.startPausedForReturning}
                onChange={onCheckbox('startPausedForReturning')}
              />
              Start paused for returning visitors
            </label>

            <label className={styles.full}>
              Poster Image URL (optional)
              <input
                placeholder="(optional) /assets/about-poster.jpg — leave blank to auto-use a frame"
                value={form.posterSrc || ''}
                onChange={onText('posterSrc')}
              />
              <div className={styles.uploaderRow}>
                <UploadButton<OurFileRouter, 'mediaUploader'>
                  endpoint="mediaUploader"
                  onClientUploadComplete={(res) => {
                    const u = extractPublicUrl(res);
                    if (u) setForm((prev) => ({ ...prev, posterSrc: u }));
                  }}
                  onUploadError={(err) =>
                    alert(err instanceof Error ? err.message : 'Upload failed')
                  }
                />
                <small>Optional — if blank, we’ll capture a still from the video</small>
              </div>
            </label>
          </>
        ) : (
          <label className={styles.full}>
            Image URL
            <input
              placeholder="/assets/about-hero.jpg"
              value={form.imageSrc}
              onChange={onText('imageSrc')}
            />
            <div className={styles.uploaderRow}>
              <UploadButton<OurFileRouter, 'mediaUploader'>
                endpoint="mediaUploader"
                onClientUploadComplete={(res) => {
                  const u = extractPublicUrl(res);
                  if (u) setForm((prev) => ({ ...prev, imageSrc: u }));
                }}
                onUploadError={(err) => alert(err instanceof Error ? err.message : 'Upload failed')}
              />
              <small>Upload hero image</small>
            </div>
          </label>
        )}

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

        <div className={styles.actions}>
          <button className={styles.save} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* ===== Preview Panel ===== */}
      <div
        style={{
          marginTop: 14,
          padding: 12,
          border: '1px solid var(--line)',
          borderRadius: 12,
          background: '#fff',
        }}
      >
        <h3 style={{ margin: 0, marginBottom: 8 }}>Current Preview</h3>
        <p style={{ marginTop: 0, color: '#6b7280' }}>
          Host: <code>{fileHost || '—'}</code>
        </p>

        {form.mediaType === 'VIDEO' && form.videoSrc ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <video
              key={previewKey}
              ref={previewRef}
              src={form.videoSrc || undefined}
              poster={form.posterSrc || undefined}
              controls
              playsInline
              style={{ width: '100%', maxHeight: 360, background: '#000', borderRadius: 10 }}
            />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className={styles.save}
                onClick={async () => {
                  const v = previewRef.current;
                  if (!v) return;
                  try {
                    v.currentTime = Math.max(0, form.loopStartSec ?? 0);
                    await v.play();
                  } catch {
                    /* ignore */
                  }
                }}
              >
                Test Loop From Start ({form.loopStartSec ?? 0}s)
              </button>
              <span style={{ color: '#6b7280' }}>
                Loop end: <strong>{form.loopEndSec ?? 0}s</strong>
              </span>
              <span style={{ color: '#6b7280' }}>
                Poster: <code>{form.posterSrc || '(auto)'}</code>
              </span>
              <span style={{ color: '#6b7280' }}>
                URL: <code style={{ wordBreak: 'break-all' }}>{form.videoSrc}</code>
              </span>
            </div>
          </div>
        ) : form.mediaType === 'IMAGE' ? (
          form.imageSrc ? (
            <Image
              src={form.imageSrc}
              alt="About hero image"
              width={1280}
              height={720}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: 360,
                objectFit: 'cover',
                borderRadius: 10,
              }}
            />
          ) : (
            <em>No image selected.</em>
          )
        ) : (
          <em>No media selected.</em>
        )}
      </div>

      {/* ===== Recent Uploads ===== */}
      <div style={{ marginTop: 14 }}>
        <h3 style={{ margin: 0, marginBottom: 8 }}>Recent Uploads</h3>
        {uploads.length ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 10,
            }}
          >
            {uploads.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  if ((m.type || '').startsWith('video')) {
                    setForm((f) => ({ ...f, mediaType: 'VIDEO', videoSrc: m.url }));
                  } else if ((m.type || '').startsWith('image')) {
                    setForm((f) => ({ ...f, mediaType: 'IMAGE', imageSrc: m.url }));
                  }
                  setPreviewKey((k) => k + 1);
                }}
                title={`${m.name} • ${m.type}`}
                style={{
                  display: 'grid',
                  gap: 6,
                  alignItems: 'start',
                  padding: 8,
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  background: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    background: '#0b0b0b',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  {(m.type || '').startsWith('image') ? (
                    <Image
                      src={m.url}
                      alt={m.name}
                      width={640}
                      height={360}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <video
                      src={m.url}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#374151' }}>
                  <strong
                    style={{
                      display: 'block',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {m.name}
                  </strong>
                  <span>{m.type}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <em style={{ color: '#6b7280' }}>No uploads yet.</em>
        )}
      </div>
    </section>
  );
}
