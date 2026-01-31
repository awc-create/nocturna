// src/components/admin/home/AboutSettings.tsx (or wherever yours lives)
'use client';

import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import styles from './AboutSettings.module.scss';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { humanUploadError } from '@/utils/uploadErrors';

type QuickFact = { value: string; label: string };
type ValueCard = { title: string; body: string };

type AboutData = {
  eyebrow: string;
  title: string;
  lead: string;
  bullets: string[];
  ctaPrimaryText: string;
  ctaPrimaryHref: string;
  ctaGhostText: string;
  ctaGhostHref: string;
  quickFacts: QuickFact[];
  values: ValueCard[];
  videoUrl?: string | null;
  videoPoster?: string | null;
  videoCaption?: string | null;
};

const FALLBACK: AboutData = {
  eyebrow: 'ABOUT Essentia',
  title: 'Bringing nightlife to life.',
  lead: 'We’re a curated collective of DJs and musicians crafting atmosphere-first experiences for venues and events. From soulful acoustics to floor-filling sets, Essentia delivers sound that fits the room — and the brand.',
  bullets: [
    'Curation over chaos — the right artist for the right room.',
    'Reliable bookings, clear comms, zero hidden costs.',
    'Artist-first ethos; venue-ready professionalism.',
  ],
  ctaPrimaryText: 'Learn more',
  ctaPrimaryHref: '/about',
  ctaGhostText: 'Enquire now',
  ctaGhostHref: '/enquire',
  quickFacts: [
    { value: '200+', label: 'Gigs curated' },
    { value: 'UK-wide', label: 'Venue coverage' },
    { value: 'DJs & Musicians', label: 'Tailored rosters' },
  ],
  values: [
    {
      title: 'Curation over chaos',
      body: 'Every brief matched to the right artist, not the nearest calendar gap.',
    },
    {
      title: 'Artist-first',
      body: 'Fair fees, clear comms, reliable logistics — because great work needs great conditions.',
    },
    {
      title: 'Venue-ready',
      body: 'Professionalism on arrival, compact setups, and volume discipline for premium hospitality.',
    },
    {
      title: 'Zero surprises',
      body: 'Transparent pricing, tidy invoicing, and dedicated point of contact from enquiry to encore.',
    },
    {
      title: 'Brand-fit sound',
      body: 'Programming that respects brand tone and guest profile at every touchpoint.',
    },
    {
      title: 'Reliable rosters',
      body: 'Depth of talent to cover multi-site schedules and last-minute changes.',
    },
    {
      title: 'Tech-ready',
      body: 'Clear specs, tidy setups, and no drama with in-house teams or residents.',
    },
    {
      title: 'Guest-first',
      body: 'Read-the-room sets that build energy without overwhelming the space.',
    },
    {
      title: 'Feedback loops',
      body: 'We learn every week to refine the policy and roster for your venue.',
    },
  ],
  videoUrl: null,
  videoPoster: null,
  videoCaption: null,
};

export default function AboutUsSettings() {
  const [form, setForm] = useState<AboutData>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bulletsDraft, setBulletsDraft] = useState<string>(FALLBACK.bullets.join('\n'));
  const bulletsRef = useRef<HTMLTextAreaElement | null>(null);

  const autoresize = (ta: HTMLTextAreaElement | null) => {
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  };

  useEffect(() => {
    autoresize(bulletsRef.current);
  }, [bulletsDraft]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/about', { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as Partial<AboutData>;
          const merged: AboutData = {
            ...FALLBACK,
            ...data,
            bullets: data.bullets ?? FALLBACK.bullets,
            quickFacts: data.quickFacts ?? FALLBACK.quickFacts,
            values: data.values ?? FALLBACK.values,
          };
          setForm(merged);
          setBulletsDraft((merged.bullets ?? []).join('\n'));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onText =
    <K extends keyof AboutData>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = typeof e?.target?.value === 'string' ? e.target.value : '';
      setForm((f) => ({ ...f, [key]: val as AboutData[K] }));
    };

  const onBulletsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = typeof e?.target?.value === 'string' ? e.target.value : '';
    setBulletsDraft(val);
  };

  const commitBullets = () => {
    const parsed = (bulletsDraft ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    setForm((f) => ({ ...f, bullets: parsed }));
  };

  // Quick facts
  const addFact = () =>
    setForm((f) => ({
      ...f,
      quickFacts: [...f.quickFacts, { value: '', label: '' }],
    }));

  const removeFact = (idx: number) =>
    setForm((f) => ({
      ...f,
      quickFacts: f.quickFacts.filter((_, i) => i !== idx),
    }));

  const onFactChange =
    (idx: number, field: keyof QuickFact) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = typeof e?.target?.value === 'string' ? e.target.value : '';
      setForm((f) => {
        const next = [...f.quickFacts];
        next[idx] = { ...next[idx], [field]: val };
        return { ...f, quickFacts: next };
      });
    };

  const moveFact = (from: number, to: number) =>
    setForm((f) => {
      if (to < 0 || to >= f.quickFacts.length) return f;
      const next = [...f.quickFacts];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...f, quickFacts: next };
    });

  // Values
  const addValue = () =>
    setForm((f) => ({
      ...f,
      values: [...f.values, { title: '', body: '' }],
    }));

  const removeValue = (idx: number) =>
    setForm((f) => ({
      ...f,
      values: f.values.filter((_, i) => i !== idx),
    }));

  const onValueChange =
    (idx: number, field: keyof ValueCard) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = typeof e?.target?.value === 'string' ? e.target.value : '';
      setForm((f) => {
        const next = [...f.values];
        next[idx] = { ...next[idx], [field]: val };
        return { ...f, values: next };
      });
    };

  const moveValue = (from: number, to: number) =>
    setForm((f) => {
      if (to < 0 || to >= f.values.length) return f;
      const next = [...f.values];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...f, values: next };
    });

  const save = async () => {
    commitBullets();
    setSaving(true);
    try {
      const res = await fetch('/api/home/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('Save /api/home/about failed:', res.status, text);
        throw new Error('Failed to save');
      }
      alert('About updated! Refresh Home to see changes.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error saving About.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.section}>
        <h2>About Us</h2>
        <p>Loading current content…</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2>About Us</h2>
      <p>Update the mini About block under the hero.</p>

      <div className={styles.form}>
        {/* Copy */}
        <label>
          Eyebrow
          <input value={form.eyebrow ?? ''} onChange={onText('eyebrow')} />
        </label>

        <label className={styles.full}>
          Title
          <input value={form.title ?? ''} onChange={onText('title')} />
        </label>

        <label className={styles.full}>
          Lead Paragraph
          <textarea rows={4} value={form.lead ?? ''} onChange={onText('lead')} />
        </label>

        <label className={styles.full}>
          Bullets (one per line)
          <textarea
            ref={bulletsRef}
            rows={5}
            value={bulletsDraft}
            onChange={onBulletsChange}
            onBlur={commitBullets}
            onInput={(e) => autoresize(e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.stopPropagation();
            }}
          />
          <small>Each line becomes a bullet point under the About text.</small>
        </label>

        {/* Quick Facts */}
        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Quick Facts</legend>

          {form.quickFacts.map((fact, i) => (
            <div key={i} className={styles.factRow}>
              <label>
                Value
                <input
                  placeholder="e.g. 200+"
                  value={fact.value}
                  onChange={onFactChange(i, 'value')}
                />
              </label>
              <label>
                Label
                <input
                  placeholder="e.g. Gigs curated"
                  value={fact.label}
                  onChange={onFactChange(i, 'label')}
                />
              </label>

              <div className={styles.factActions} aria-label="Quick fact actions">
                <button type="button" onClick={() => moveFact(i, i - 1)} title="Move up">
                  ↑
                </button>
                <button type="button" onClick={() => moveFact(i, i + 1)} title="Move down">
                  ↓
                </button>
                <button type="button" onClick={() => removeFact(i)} title="Remove">
                  ✕
                </button>
              </div>
            </div>
          ))}

          <button type="button" className={styles.addBtn} onClick={addFact}>
            + Add Fact
          </button>
        </fieldset>

        {/* Values */}
        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Ethos &amp; values</legend>

          {form.values.map((val, i) => (
            <div key={i} className={styles.factRow}>
              <label>
                Title
                <input
                  placeholder="e.g. Artist-first"
                  value={val.title}
                  onChange={onValueChange(i, 'title')}
                />
              </label>
              <label className={styles.full}>
                Body
                <textarea
                  rows={2}
                  placeholder="Short line describing the value…"
                  value={val.body}
                  onChange={onValueChange(i, 'body')}
                />
              </label>

              <div className={styles.factActions} aria-label="Value actions">
                <button type="button" onClick={() => moveValue(i, i - 1)} title="Move up">
                  ↑
                </button>
                <button type="button" onClick={() => moveValue(i, i + 1)} title="Move down">
                  ↓
                </button>
                <button type="button" onClick={() => removeValue(i)} title="Remove">
                  ✕
                </button>
              </div>
            </div>
          ))}

          <button type="button" className={styles.addBtn} onClick={addValue}>
            + Add value
          </button>
        </fieldset>

        {/* VIDEO ONLY */}
        <fieldset className={styles.fieldset}>
          <legend>About Video</legend>

          <label className={styles.full}>
            Video URL
            <input
              placeholder="Paste a YouTube link or leave empty and upload below…"
              value={form.videoUrl ?? ''}
              onChange={onText('videoUrl')}
            />
            <small>
              Option 1: paste a YouTube URL (Unlisted is fine). Option 2: upload a video file and
              we&apos;ll store its URL here.
            </small>
          </label>

          <label className={styles.full}>
            Upload video file (optional)
            <div className={styles.uploaderRow}>
              <UploadButton<OurFileRouter, 'videoUploader'>
                endpoint="videoUploader"
                onClientUploadComplete={(res) => {
                  const u = res?.[0]?.ufsUrl ?? res?.[0]?.url;
                  if (!u) return;
                  setForm((prev) => ({ ...prev, videoUrl: u }));
                }}
                onUploadError={(err) => {
                  alert(humanUploadError(err, 'video'));
                }}
              />
              <small>
                MP4 / MOV / WEBM, up to ~128MB. For long, high-quality cuts, YouTube is usually
                better.
              </small>
            </div>
          </label>

          <label>
            Caption (optional)
            <input
              placeholder="1-minute overview"
              value={form.videoCaption ?? ''}
              onChange={onText('videoCaption')}
            />
          </label>

          {form.videoUrl ? (
            <video
              src={form.videoUrl}
              poster={form.videoPoster ?? undefined}
              controls
              className={styles.previewVideo}
            />
          ) : null}
        </fieldset>

        {/* POSTER IMAGE ONLY */}
        <fieldset className={styles.fieldset}>
          <legend>Poster Image</legend>

          <label className={styles.full}>
            Poster Image URL
            <input
              placeholder="/assets/about-poster.jpg"
              value={form.videoPoster ?? ''}
              onChange={onText('videoPoster')}
            />
            <small>Used as the thumbnail on the About section before the video opens.</small>
          </label>

          <label className={styles.full}>
            Upload poster image (optional)
            <div className={styles.uploaderRow}>
              <UploadButton<OurFileRouter, 'imageUploader'>
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  const u = res?.[0]?.ufsUrl ?? res?.[0]?.url;
                  if (!u) return;
                  setForm((prev) => ({ ...prev, videoPoster: u }));
                }}
                onUploadError={(err) => {
                  alert(humanUploadError(err, 'image'));
                }}
              />
              <small>JPG / PNG / WEBP; up to ~16MB.</small>
            </div>
          </label>

          {form.videoPoster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.videoPoster}
              alt="About section poster preview"
              className={styles.posterPreview}
            />
          ) : null}
        </fieldset>

        {/* CTAs */}
        <fieldset className={styles.fieldset}>
          <legend>Primary CTA</legend>
          <label>
            Text
            <input value={form.ctaPrimaryText} onChange={onText('ctaPrimaryText')} />
          </label>
          <label>
            Link
            <input value={form.ctaPrimaryHref} onChange={onText('ctaPrimaryHref')} />
          </label>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend>Secondary CTA</legend>
          <label>
            Text
            <input value={form.ctaGhostText} onChange={onText('ctaGhostText')} />
          </label>
          <label>
            Link
            <input value={form.ctaGhostHref} onChange={onText('ctaGhostHref')} />
          </label>
        </fieldset>

        <div className={styles.actions}>
          <button className={styles.save} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </section>
  );
}
