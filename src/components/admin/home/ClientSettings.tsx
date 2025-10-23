'use client';

import { useEffect, useState } from 'react';
import styles from './ClientSettings.module.scss';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

type ClientLogo = { name: string; src: string; href?: string };

type ClientsData = {
  title: string;
  subtitle: string;
  items: ClientLogo[];
};

const FALLBACK: ClientsData = {
  title: 'Our Clients',
  subtitle: 'Trusted by leading venues, bars and creative brands.',
  items: [
    { name: 'Garden', src: '/assets/clients/garden.png' },
    { name: 'Luna', src: '/assets/clients/luna.png' },
    { name: 'Stardust', src: '/assets/clients/stardust.png' },
    { name: 'Stellar', src: '/assets/clients/stellar.png' },
    { name: 'Symphony', src: '/assets/clients/symphony.png' },
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
        if (res.ok) {
          const data = (await res.json()) as Partial<ClientsData>;
          setForm({ ...FALLBACK, ...data, items: data.items ?? FALLBACK.items });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onText =
    <K extends keyof ClientsData>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value as ClientsData[K] }));

  const updateItem =
    (idx: number, field: keyof ClientLogo) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setForm((f) => {
        const next = [...f.items];
        next[idx] = { ...next[idx], [field]: val };
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
    setForm((f) => ({ ...f, items: [...f.items, { name: '', src: '', href: '' }] }));

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
        alert(payload?.error || `Failed to save (status ${res.status}).`);
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
      <p>Manage the logos (grid for ≤5, auto-scrolling marquee for 6+). Uploads store CDN URLs.</p>

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
          <legend>Logos</legend>

          {form.items.map((it, i) => (
            <div key={i} className={styles.logoRow}>
              <label>
                Name
                <input value={it.name} onChange={updateItem(i, 'name')} />
              </label>

              <label className={styles.full}>
                Image URL
                <input placeholder="https://cdn…" value={it.src} onChange={updateItem(i, 'src')} />
                <div className={styles.uploaderRow}>
                  <UploadButton<OurFileRouter, 'mediaUploader'>
                    endpoint="mediaUploader"
                    onClientUploadComplete={(res) => {
                      const url = res?.[0]?.url;
                      if (url) setItemSrc(i, url); // ✅ save CDN url into form
                    }}
                    onUploadError={(err) => {
                      alert(err instanceof Error ? err.message : 'Upload failed');
                    }}
                  />
                  <small>PNG/SVG preferred. Transparent works best on dark theme.</small>
                </div>
              </label>

              <label>
                Link (optional)
                <input
                  placeholder="https://…"
                  value={it.href ?? ''}
                  onChange={updateItem(i, 'href')}
                />
              </label>

              <button type="button" className={styles.removeBtn} onClick={() => removeItem(i)}>
                ✕ Remove
              </button>
            </div>
          ))}

          <button type="button" className={styles.addBtn} onClick={addItem}>
            + Add Logo
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
