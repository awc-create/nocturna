// ✅ FULL: src/components/admin/home/ServicesSettings.tsx

'use client';

import { useEffect, useState } from 'react';
import type React from 'react';
import Image from 'next/image';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { humanUploadError } from '@/utils/uploadErrors';
import styles from './ServicesSettings.module.scss';

type Service = {
  key: string;
  title: string;
  blurb: string;
  href: string;
  image: string;
  tag: string;
  detail?: string;
  includes?: string[];
  /** Front image darkness (0 → 0.8). Higher = darker. */
  overlay?: number;
};

type ServicesData = {
  kicker: string;
  title: string;
  lead: string;
  items: Service[];
};

const DEFAULT_OVERLAY = 0.55;

// ✅ Type-safe CSS vars for inline style
type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

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
      detail:
        'Our DJ roster includes experienced selectors used to brand-fit programming, guest-flow control and multi-room setups.',
      includes: [
        'Programming aligned to time of day and atmosphere',
        'DJs briefed on volume, tone, and venue context',
        'Clear communication and artist alignment',
        'One point of contact throughout',
        'Reliable cover if availability changes',
      ],
      overlay: DEFAULT_OVERLAY,
    },
    {
      key: 'musician',
      title: 'Musicians',
      blurb:
        'Acoustic duos, sax, strings, vocalists — atmosphere-first performances curated for intimate dining and premium hospitality.',
      href: '#enquire',
      image: '/assets/services/musicians.jpg',
      tag: 'Live atmosphere',
      detail:
        'We supply adaptable musicians for brunch, dinner or lounges — artists who enhance the atmosphere without overwhelming the room.',
      includes: [
        'Set formats matched to service style and energy',
        'Musicians briefed on volume, tone, and venue context',
        'Clear communication and artist alignment',
        'One point of contact throughout',
        'Reliable cover if availability changes',
      ],
      overlay: DEFAULT_OVERLAY,
    },
  ],
};

function clampOverlay(v: unknown, fallback: number) {
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback;
  return Math.min(0.8, Math.max(0, v));
}

export default function ServicesSettings() {
  const [form, setForm] = useState<ServicesData>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/services', { cache: 'no-store' });
        if (!res.ok) return;

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
            detail: item.detail ?? FALLBACK.items[i]?.detail ?? '',
            includes: Array.isArray(item.includes)
              ? item.includes.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim())
              : Array.isArray(FALLBACK.items[i]?.includes)
                ? (FALLBACK.items[i]?.includes as string[])
                : [],
            overlay: clampOverlay(
              (item as Service).overlay,
              FALLBACK.items[i]?.overlay ?? DEFAULT_OVERLAY
            ),
          })),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onText =
    <K extends keyof ServicesData>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.currentTarget.value;
      setForm((f) => ({ ...f, [key]: val as ServicesData[K] }));
    };

  const updateItem =
    (idx: number, field: keyof Service) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.currentTarget.value;
      setForm((f) => {
        const next = [...f.items];
        next[idx] = { ...next[idx], [field]: val };
        return { ...f, items: next };
      });
    };

  const setItem = (idx: number, patch: Partial<Service>) =>
    setForm((f) => {
      const next = [...f.items];
      next[idx] = { ...next[idx], ...patch };
      return { ...f, items: next };
    });

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
          detail: '',
          includes: [],
          overlay: DEFAULT_OVERLAY,
        },
      ],
    }));

  const removeItem = (idx: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  /* =============================
     Includes helpers (add/remove/reorder/edit)
     ============================= */

  const setIncludes = (idx: number, includes: string[]) => setItem(idx, { includes });

  const addInclude = (idx: number) => {
    const current = Array.isArray(form.items[idx]?.includes)
      ? (form.items[idx].includes as string[])
      : [];
    setIncludes(idx, [...current, '']);
  };

  const updateInclude = (idx: number, j: number, value: string) => {
    const current = Array.isArray(form.items[idx]?.includes)
      ? [...(form.items[idx].includes as string[])]
      : [];
    current[j] = value;
    setIncludes(idx, current);
  };

  const removeInclude = (idx: number, j: number) => {
    const current = Array.isArray(form.items[idx]?.includes)
      ? [...(form.items[idx].includes as string[])]
      : [];
    current.splice(j, 1);
    setIncludes(idx, current);
  };

  const moveInclude = (idx: number, from: number, dir: -1 | 1) => {
    const current = Array.isArray(form.items[idx]?.includes)
      ? [...(form.items[idx].includes as string[])]
      : [];
    const to = from + dir;
    if (to < 0 || to >= current.length) return;
    const tmp = current[from];
    current[from] = current[to];
    current[to] = tmp;
    setIncludes(idx, current);
  };

  const save = async () => {
    setSaving(true);
    try {
      // trim includes + clamp overlay before save
      const payload: ServicesData = {
        ...form,
        items: form.items.map((it) => ({
          ...it,
          includes: Array.isArray(it.includes)
            ? it.includes.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean)
            : [],
          overlay: clampOverlay(it.overlay, DEFAULT_OVERLAY),
        })),
      };

      const res = await fetch('/api/home/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((json as { error?: string }).error || `Failed to save (status ${res.status}).`);
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

          {form.items.map((item, i) => {
            const overlay = clampOverlay(item.overlay, DEFAULT_OVERLAY);
            const previewVars: CSSVars = { '--previewOverlay': `${overlay}` };

            return (
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
                  <textarea rows={3} value={item.blurb} onChange={updateItem(i, 'blurb')} />
                </label>

                <label className={styles.full}>
                  Deeper explanation (back of card)
                  <textarea rows={3} value={item.detail ?? ''} onChange={updateItem(i, 'detail')} />
                </label>

                {/* ✅ INCLUDES (editable + reorder) */}
                <div className={`${styles.full} ${styles.includesEditor}`}>
                  <div className={styles.includesHeader}>
                    <div>
                      <strong>What’s included</strong>
                      <div className={styles.includesSub}>
                        Bullets shown on hover/tap (back of card).
                      </div>
                    </div>
                    <button type="button" className={styles.smallBtn} onClick={() => addInclude(i)}>
                      + Add bullet
                    </button>
                  </div>

                  {(item.includes?.length ?? 0) > 0 ? (
                    <div className={styles.includesList}>
                      {(item.includes ?? []).map((line, j) => (
                        <div key={j} className={styles.includeRow}>
                          <input
                            value={line}
                            onChange={(e) => updateInclude(i, j, e.currentTarget.value)}
                            placeholder="e.g. Programming aligned to time of day and atmosphere"
                          />

                          <div className={styles.includeBtns}>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              onClick={() => moveInclude(i, j, -1)}
                              aria-label="Move up"
                              title="Move up"
                              disabled={j === 0}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              onClick={() => moveInclude(i, j, 1)}
                              aria-label="Move down"
                              title="Move down"
                              disabled={j === (item.includes?.length ?? 1) - 1}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className={styles.iconBtnDanger}
                              onClick={() => removeInclude(i, j)}
                              aria-label="Remove"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.includesEmpty}>No bullets yet. Click “Add bullet”.</div>
                  )}
                </div>

                <label>
                  Link
                  <input
                    value={item.href}
                    onChange={updateItem(i, 'href')}
                    placeholder="#enquire"
                  />
                </label>

                <label>
                  Image URL
                  <input
                    value={item.image}
                    onChange={updateItem(i, 'image')}
                    placeholder="/assets/services/djs.jpg"
                  />
                </label>

                <div className={styles.uploadRow}>
                  <UploadButton<OurFileRouter, 'imageUploader'>
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      const url = (res?.[0]?.ufsUrl ?? res?.[0]?.url ?? '').trim();
                      if (!url) return;
                      setItem(i, { image: url });
                    }}
                    onUploadError={(err) => alert(humanUploadError(err, 'image'))}
                  />
                  <button
                    type="button"
                    className={styles.smallBtnDanger}
                    onClick={() => setItem(i, { image: '' })}
                    disabled={!item.image}
                    title="Remove image (leave blank)"
                  >
                    Clear image
                  </button>
                </div>

                {/* ✅ Darkness slider (live updates preview) */}
                <label className={styles.full}>
                  Image darkness
                  <input
                    type="range"
                    min={0}
                    max={0.8}
                    step={0.05}
                    value={overlay}
                    onChange={(e) => setItem(i, { overlay: Number(e.currentTarget.value) })}
                  />
                  <small className={styles.helpText}>
                    Controls the dark overlay on the front image. Higher = darker.
                  </small>
                </label>

                {/* ✅ Live preview that responds to slider */}
                {item.image && (
                  <div className={styles.previewRow}>
                    <div className={styles.previewThumb} style={previewVars}>
                      <Image
                        src={item.image}
                        alt="Service image preview"
                        className={styles.imagePreview}
                        width={260}
                        height={160}
                      />
                      <div className={styles.previewOverlay} aria-hidden="true" />
                    </div>
                  </div>
                )}

                <button type="button" className={styles.removeBtn} onClick={() => removeItem(i)}>
                  ✕ Remove
                </button>
              </div>
            );
          })}

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
