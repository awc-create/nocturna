'use client';

import { useEffect, useState } from 'react';
import type React from 'react';
import Image from 'next/image';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import styles from './ServicesSettings.module.scss';

type Service = {
  key: string;
  title: string;
  blurb: string; // front-of-card copy
  href: string;
  image: string; // front image
  tag: string;
  backImage?: string; // optional back image
  detail?: string; // deeper explanation (back of card)
};

type ServicesData = {
  kicker: string;
  title: string;
  lead: string;
  items: Service[];
};

const FALLBACK: ServicesData = {
  kicker: 'Our Services',
  title: 'Sound that fits the room.',
  lead: 'Two core offerings to start — built to scale with your brand.',
  items: [
    {
      key: 'dj',
      title: 'DJs',
      blurb:
        'Signature selectors for restaurants, bars and late-night venues. Floor-filling sets matched to brand, guest profile, and time of day.',
      href: '#enquire',
      image: '/assets/services/djs.jpg',
      tag: 'Nightlife energy',
      backImage: '/assets/services/djs-back.jpg',
      detail:
        'From weekly residencies to one-off openings, we curate DJs who understand programming, volume discipline and guest flow across the whole night. We manage briefings, scheduling and reliable cover so your venue always has the right selector on the decks.',
    },
    {
      key: 'musician',
      title: 'Musicians',
      blurb:
        'Acoustic duos, sax, strings, vocalists — atmosphere-first performances curated for intimate dining and premium hospitality.',
      href: '#enquire',
      image: '/assets/services/musicians.jpg',
      tag: 'Live atmosphere',
      backImage: '/assets/services/musicians-back.jpg',
      detail:
        'For brunch, dinner or late-night lounges, we supply musicians who can read the room and adapt sets to brand, moment and space. We look after repertoire, logistics and simple tech so the performance feels intentional, not intrusive.',
    },
  ],
};

export default function ServicesSettings() {
  const [form, setForm] = useState<ServicesData>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/services', { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as Partial<ServicesData>;

          const itemsFromApi =
            Array.isArray(data.items) && data.items.length ? data.items : FALLBACK.items;

          setForm({
            kicker: data.kicker ?? FALLBACK.kicker,
            title: data.title ?? FALLBACK.title,
            lead: data.lead ?? FALLBACK.lead,
            items: itemsFromApi.map((item, i) => ({
              key: item.key || FALLBACK.items[i]?.key || `service-${i}`,
              title: item.title || FALLBACK.items[i]?.title || '',
              blurb: item.blurb || FALLBACK.items[i]?.blurb || '',
              href: item.href || FALLBACK.items[i]?.href || '#enquire',
              image: item.image || FALLBACK.items[i]?.image || '',
              tag: item.tag || FALLBACK.items[i]?.tag || '',
              backImage: item.backImage || FALLBACK.items[i]?.backImage || item.image || '',
              detail: item.detail ?? FALLBACK.items[i]?.detail ?? '',
            })),
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onText =
    <K extends keyof ServicesData>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      setForm((f) => ({ ...f, [key]: val as ServicesData[K] }));
    };

  const updateItem =
    (idx: number, field: keyof Service) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      setForm((f) => {
        const next = [...f.items];
        next[idx] = { ...next[idx], [field]: val };
        return { ...f, items: next };
      });
    };

  const addItem = () =>
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        {
          key: '',
          title: '',
          blurb: '',
          href: '#enquire',
          image: '',
          tag: '',
          backImage: '',
          detail: '',
        },
      ],
    }));

  const removeItem = (idx: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/home/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (payload as { error?: string }).error || `Failed to save (status ${res.status}).`;
        alert(msg);
        return;
      }

      alert('Services updated! Refresh Home to see changes.');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Network error saving Services.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.section}>
        <h2>Services</h2>
        <p>Loading current content…</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2>Services</h2>
      <p>Manage the home-page Services grid content.</p>

      <div className={styles.form}>
        <label>
          Kicker
          <input value={form.kicker} onChange={onText('kicker')} />
        </label>

        <label className={styles.full}>
          Title
          <input value={form.title} onChange={onText('title')} />
        </label>

        <label className={styles.full}>
          Lead Paragraph
          <textarea rows={3} value={form.lead} onChange={onText('lead')} />
        </label>

        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Service Cards</legend>

          {form.items.map((item, i) => (
            <div key={item.key || i} className={styles.itemRow}>
              <label>
                Title
                <input
                  value={item.title}
                  onChange={updateItem(i, 'title')}
                  placeholder="e.g. DJs"
                />
              </label>

              <label>
                Tagline
                <input
                  value={item.tag}
                  onChange={updateItem(i, 'tag')}
                  placeholder="e.g. Nightlife energy"
                />
              </label>

              <label className={styles.full}>
                Front description
                <textarea
                  rows={3}
                  value={item.blurb}
                  onChange={updateItem(i, 'blurb')}
                  placeholder="Short front-of-card copy…"
                />
              </label>

              <label className={styles.full}>
                Deeper explanation (back of card)
                <textarea
                  rows={3}
                  value={item.detail ?? ''}
                  onChange={updateItem(i, 'detail')}
                  placeholder="Optional: slightly longer explanation shown when the card flips."
                />
              </label>

              <label>
                Link
                <input value={item.href} onChange={updateItem(i, 'href')} placeholder="#enquire" />
              </label>

              <label>
                Front image URL
                <input
                  value={item.image}
                  onChange={updateItem(i, 'image')}
                  placeholder="/assets/services/djs.jpg"
                />
              </label>

              <div className={styles.uploadRow}>
                <UploadButton<OurFileRouter, 'mediaUploader'>
                  endpoint="mediaUploader"
                  onClientUploadComplete={(res) => {
                    const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
                    if (!url) return;
                    setForm((prev) => {
                      const next = [...prev.items];
                      next[i] = { ...next[i], image: url };
                      return { ...prev, items: next };
                    });
                  }}
                  onUploadError={(err: unknown) => {
                    const msg = err instanceof Error ? err.message : 'Upload failed';
                    alert(msg);
                  }}
                />
                <small>Optional: upload a front image for this card.</small>
              </div>

              <label>
                Back image URL (optional)
                <input
                  value={item.backImage ?? ''}
                  onChange={updateItem(i, 'backImage')}
                  placeholder="Defaults to front image if left empty."
                />
              </label>

              <div className={styles.uploadRow}>
                <UploadButton<OurFileRouter, 'mediaUploader'>
                  endpoint="mediaUploader"
                  onClientUploadComplete={(res) => {
                    const url = res?.[0]?.ufsUrl ?? res?.[0]?.url;
                    if (!url) return;
                    setForm((prev) => {
                      const next = [...prev.items];
                      next[i] = { ...next[i], backImage: url };
                      return { ...prev, items: next };
                    });
                  }}
                  onUploadError={(err: unknown) => {
                    const msg = err instanceof Error ? err.message : 'Upload failed';
                    alert(msg);
                  }}
                />
                <small>Optional: upload a different image for the back of the card.</small>
              </div>

              {(item.image || item.backImage) && (
                <div className={styles.previewRow}>
                  {item.image && (
                    <Image
                      src={item.image}
                      alt="Front image preview"
                      className={styles.imagePreview}
                      width={260}
                      height={160}
                    />
                  )}
                  {item.backImage && item.backImage !== item.image && (
                    <Image
                      src={item.backImage}
                      alt="Back image preview"
                      className={styles.imagePreview}
                      width={260}
                      height={160}
                    />
                  )}
                </div>
              )}

              <button type="button" className={styles.removeBtn} onClick={() => removeItem(i)}>
                ✕ Remove
              </button>
            </div>
          ))}

          <button type="button" className={styles.addBtn} onClick={addItem}>
            + Add Service
          </button>
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
