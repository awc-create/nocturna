// src/components/admin/home/ServicesSettings.tsx
'use client';

import { useEffect, useState } from 'react';
import styles from './ServicesSettings.module.scss';

type Service = {
  key: string;
  title: string;
  blurb: string;
  href: string;
  image: string;
  tag: string;
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
      href: '/services/djs',
      image: '/assets/services/djs.jpg',
      tag: 'Nightlife energy',
    },
    {
      key: 'musician',
      title: 'Musicians',
      blurb:
        'Acoustic duos, sax, strings, vocalists — atmosphere-first performances curated for intimate dining and premium hospitality.',
      href: '/services/musicians',
      image: '/assets/services/musicians.jpg',
      tag: 'Live atmosphere',
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
          setForm({ ...FALLBACK, ...data, items: data.items ?? FALLBACK.items });
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

  // Manage service cards
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
      items: [...f.items, { key: '', title: '', blurb: '', href: '', image: '', tag: '' }],
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
        const msg = payload?.error || `Failed to save (status ${res.status}).`;
        alert(msg);
        return;
      }

      alert('Services updated! Refresh Home to see changes.');
    } catch (e) {
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

        {/* Service Items */}
        <fieldset className={`${styles.fieldset} ${styles.full}`}>
          <legend>Service Cards</legend>
          {form.items.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <label>
                Title
                <input value={item.title} onChange={updateItem(i, 'title')} />
              </label>
              <label>
                Tagline
                <input value={item.tag} onChange={updateItem(i, 'tag')} />
              </label>
              <label className={styles.full}>
                Description
                <textarea rows={3} value={item.blurb} onChange={updateItem(i, 'blurb')} />
              </label>
              <label>
                Link
                <input value={item.href} onChange={updateItem(i, 'href')} />
              </label>
              <label>
                Image URL
                <input value={item.image} onChange={updateItem(i, 'image')} />
              </label>
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
