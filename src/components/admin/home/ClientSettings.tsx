'use client';

import { useEffect, useState } from 'react';
import styles from './ClientSettings.module.scss';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';
import { humanUploadError } from '@/utils/uploadErrors';

type ClientLogo = {
  name: string;
  src: string;
  href?: string;

  blurb?: string;

  quote?: string;
  personName?: string;
  personTitle?: string;

  storyUrl?: string;
  storyLabel?: string;

  backBg?: string;
};

type ClientsData = {
  title: string;
  subtitle: string;
  items: ClientLogo[];
};

const FALLBACK: ClientsData = {
  title: 'Our Clients',
  subtitle: 'Trusted by leading venues, bars and creative brands.',
  items: [
    {
      name: "Regina's Bar & Restaurant",
      src: '/assets/clients/garden.png',
      blurb: 'Restaurant & Late-Night Bar, Birmingham',
      quote: '“They keep the room perfectly tuned, from first drink to last call.”',
      personName: 'Gregorio',
      personTitle: 'General Manager',
      storyUrl: '/case-studies/reginas',
      storyLabel: 'Watch the story',
      // backBg: 'linear-gradient(180deg, rgba(2,6,23,.55), rgba(2,6,23,.88))',
    },
    {
      name: 'Luna Lounge',
      src: '/assets/clients/luna.png',
      blurb: 'Cocktail bar & events venue',
      quote: '“Smooth, brand-safe sets that still feel fresh every week.”',
      personName: '—',
      personTitle: 'Brand Director',
    },
    {
      name: 'Stardust',
      src: '/assets/clients/stardust.png',
      blurb: 'Live events & private hire',
      quote: '“Reliable rosters and zero drama with tech or timings.”',
      personName: '—',
      personTitle: 'Events Lead',
    },
    {
      name: 'Stellar',
      src: '/assets/clients/stellar.png',
      blurb: 'Late-night venue',
      quote: '“Guests notice the music — in a good way, not a loud way.”',
      personName: '—',
      personTitle: 'Venue Owner',
    },
    {
      name: 'Symphony Center',
      src: '/assets/clients/symphony.png',
      blurb: 'Culture & programming',
      quote: '“They understand our audience and programme to match.”',
      personName: '—',
      personTitle: 'Programming Manager',
    },
  ],
};

export default function ClientSettings() {
  const [form, setForm] = useState<ClientsData>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/clients', { cache: 'no-store' });
        if (!res.ok) return;

        const data = (await res.json()) as Partial<ClientsData> & { lead?: string };

        // API may return subtitle OR lead (legacy). Normalize.
        const subtitle = typeof data.subtitle === 'string' ? data.subtitle : data.lead;

        setForm({
          ...FALLBACK,
          ...data,
          subtitle: subtitle ?? FALLBACK.subtitle,
          items: Array.isArray(data.items) ? (data.items as ClientLogo[]) : FALLBACK.items,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onText =
    <K extends keyof ClientsData>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = typeof e?.currentTarget?.value === 'string' ? e.currentTarget.value : '';
      setForm((f) => ({ ...f, [key]: val as ClientsData[K] }));
    };

  const updateItem =
    <K extends keyof ClientLogo>(idx: number, field: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = typeof e?.currentTarget?.value === 'string' ? e.currentTarget.value : '';
      setForm((f) => {
        const next = [...f.items];
        next[idx] = { ...next[idx], [field]: val } as ClientLogo;
        return { ...f, items: next };
      });
    };

  const setItemSrc = (idx: number, url: string) =>
    setForm((f) => {
      const next = [...f.items];
      next[idx] = { ...next[idx], src: url };
      return { ...f, items: next };
    });

  const addItem = () =>
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        {
          name: '',
          src: '',
          href: '',
          blurb: '',
          quote: '',
          personName: '',
          personTitle: '',
          storyUrl: '',
          storyLabel: '',
          backBg: '',
        },
      ],
    }));

  const removeItem = (idx: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/home/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((payload as { error?: string })?.error || `Failed to save (status ${res.status}).`);
        return;
      }
      alert('Clients updated! Refresh Home to see changes.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Network error saving Clients.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.section}>
        <h2>Clients</h2>
        <p>Loading current content…</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2>Clients</h2>
      <p>
        Manage logos (grid for ≤5, auto-scrolling marquee for 6+). Back face supports quote + person
        + story CTA.
      </p>

      <div className={styles.form}>
        <label className={styles.full}>
          Title
          <input value={form.title} onChange={onText('title')} />
        </label>

        <label className={styles.full}>
          Subtitle
          <input value={form.subtitle} onChange={onText('subtitle')} />
        </label>

        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Clients</legend>

          {form.items.map((it, i) => (
            <div key={i} className={styles.logoRow}>
              <label>
                Client name
                <input value={it.name} onChange={updateItem(i, 'name')} />
              </label>

              <label>
                Link (optional)
                <input
                  placeholder="https://…"
                  value={it.href ?? ''}
                  onChange={updateItem(i, 'href')}
                />
              </label>

              <label className={styles.full}>
                Image URL
                <input placeholder="https://cdn…" value={it.src} onChange={updateItem(i, 'src')} />
                <div className={styles.uploaderRow}>
                  <UploadButton<OurFileRouter, 'imageUploader'>
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      const url = res?.[0]?.ufsUrl ?? res?.[0]?.url ?? '';
                      if (url) setItemSrc(i, url);
                    }}
                    onUploadError={(err) => {
                      alert(humanUploadError(err, 'image'));
                    }}
                  />
                  <small>PNG/SVG preferred. Transparent works best on dark theme.</small>
                </div>
              </label>

              <label className={styles.full}>
                Sub label (front)
                <input
                  placeholder="Restaurant & Late-Night Bar, Birmingham"
                  value={it.blurb ?? ''}
                  onChange={updateItem(i, 'blurb')}
                />
              </label>

              <label className={styles.full}>
                Quote (back)
                <input
                  placeholder="“They keep the room perfectly tuned…”"
                  value={it.quote ?? ''}
                  onChange={updateItem(i, 'quote')}
                />
              </label>

              <div className={styles.twoCol}>
                <label>
                  Person name (back)
                  <input value={it.personName ?? ''} onChange={updateItem(i, 'personName')} />
                </label>

                <label>
                  Person title (back)
                  <input value={it.personTitle ?? ''} onChange={updateItem(i, 'personTitle')} />
                </label>
              </div>

              <div className={styles.twoCol}>
                <label>
                  Story / video URL (back button)
                  <input
                    placeholder="https://…"
                    value={it.storyUrl ?? ''}
                    onChange={updateItem(i, 'storyUrl')}
                  />
                </label>

                <label>
                  Button label (optional)
                  <input value={it.storyLabel ?? ''} onChange={updateItem(i, 'storyLabel')} />
                </label>
              </div>

              <label className={styles.full}>
                Back background (optional CSS background)
                <input
                  placeholder="linear-gradient(180deg, rgba(2,6,23,.5), rgba(2,6,23,.85))"
                  value={it.backBg ?? ''}
                  onChange={updateItem(i, 'backBg')}
                />
              </label>

              <button type="button" className={styles.removeBtn} onClick={() => removeItem(i)}>
                ✕ Remove
              </button>
            </div>
          ))}

          <button type="button" className={styles.addBtn} onClick={addItem}>
            + Add Client
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
