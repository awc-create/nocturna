'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import styles from './EnquireSettings.module.scss'; // reuse styles

type ContactConfig = {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  recipientEmail: string;
};

const FALLBACK: ContactConfig = {
  title: 'Send us a message.',
  description: 'We’ll get back to you shortly.',
  submitLabel: 'Send Message',
  successMessage: 'Thanks — we’ll be in touch soon.',
  recipientEmail: '',
};

export default function ContactSettings() {
  const [config, setConfig] = useState<ContactConfig>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/home/contact', { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as Partial<ContactConfig>;
          setConfig({
            title: data.title?.trim() || FALLBACK.title,
            description: data.description?.trim() || FALLBACK.description,
            submitLabel: data.submitLabel?.trim() || FALLBACK.submitLabel,
            successMessage: data.successMessage?.trim() || FALLBACK.successMessage,
            recipientEmail: data.recipientEmail?.trim() || '',
          });
        }
      } catch {
        // ignore, keep fallback
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onChange =
    (key: keyof ContactConfig) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setConfig((prev) => ({ ...prev, [key]: value }));
    };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/home/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error('Save /api/home/contact failed:', res.status, txt);
        throw new Error('Failed to save contact settings.');
      }

      alert('Contact settings updated. Refresh the site to see changes.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error saving contact.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.section}>
        <h2>Contact</h2>
        <p>Loading contact settings…</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2>Contact</h2>
      <p>Control the contact modal copy and recipient email.</p>

      <div className={styles.form}>
        <label className={styles.full}>
          Title
          <input
            value={config.title}
            onChange={onChange('title')}
            placeholder="Send us a message."
          />
        </label>

        <label className={styles.full}>
          Description
          <textarea
            rows={3}
            value={config.description}
            onChange={onChange('description')}
            placeholder="We’ll get back to you shortly."
          />
        </label>

        <label>
          Submit button label
          <input
            value={config.submitLabel}
            onChange={onChange('submitLabel')}
            placeholder="Send Message"
          />
        </label>

        <label>
          Success message
          <input
            value={config.successMessage}
            onChange={onChange('successMessage')}
            placeholder="Thanks — we’ll be in touch soon."
          />
        </label>

        <label className={styles.full}>
          Recipient email (where contact form submissions go)
          <input
            type="email"
            value={config.recipientEmail}
            onChange={onChange('recipientEmail')}
            placeholder="hello@nocturna.com"
          />
        </label>

        <div className={styles.actions}>
          <button type="button" className={styles.save} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </section>
  );
}
