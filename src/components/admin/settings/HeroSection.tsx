'use client';

import { useEffect, useState } from 'react';
import styles from './HeroSettings.module.scss';

type HeroForm = {
  imageSrc: string;
  title: string;
  description: string;
};

const DEFAULTS: HeroForm = {
  imageSrc: '/assets/hero.png',
  title: 'Your Modern Website Starts Here',
  description:
    'Crafted with performance and style in mind. This is your launchpad for a fast, clean, and responsive online presence — proudly created with the Web Dev Wizard CLI.',
};

export default function HeroSettings() {
  const [form, setForm] = useState<HeroForm>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  // load from DB via API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/hero', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<HeroForm>;
        setForm({ ...DEFAULTS, ...data });
      } catch {
        // ignore
      }
    })();
  }, []);

  const setField =
    (key: keyof HeroForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        alert('Failed to save. Check your server logs.');
        return;
      }
      alert('Hero updated! Visit Home to see it.');
    } catch {
      alert('Network error saving hero.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.section}>
      <h2>Home Hero</h2>
      <p>Update the home page hero image, heading, and paragraph.</p>

      <div className={styles.form}>
        <label>
          Hero Image (PNG path or URL)
          <input
            placeholder="/assets/hero.png"
            value={form.imageSrc}
            onChange={setField('imageSrc')}
          />
        </label>

        <label>
          Heading
          <input
            placeholder="Your Modern Website Starts Here"
            value={form.title}
            onChange={setField('title')}
          />
        </label>

        <label className={styles.full}>
          Paragraph
          <textarea
            rows={4}
            placeholder="Crafted with performance and style in mind..."
            value={form.description}
            onChange={setField('description')}
          />
        </label>

        <div className={styles.actions}>
          <button className={styles.save} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </section>
  );
}
