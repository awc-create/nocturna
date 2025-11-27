'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModals } from '../modals/ModalContext';
import styles from './ContactModal.module.scss';

type FormState = 'idle' | 'sending' | 'success' | 'error';

type ContactConfig = {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
};

const FALLBACK: ContactConfig = {
  title: 'Send us a message.',
  description: 'We’ll get back to you shortly.',
  submitLabel: 'Send Message',
  successMessage: 'Thanks — we’ll be in touch soon.',
};

function ContactModalContent() {
  const { close } = useModals();
  const [status, setStatus] = useState<FormState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ContactConfig>(FALLBACK);

  // Lock scroll when open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Load copy from admin-configurable home contact
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch('/api/home/contact', { cache: 'no-store' });
        if (!res.ok) return;

        const json = (await res.json()) as Partial<ContactConfig>;
        if (!mounted) return;

        setConfig({
          title: json.title?.trim() || FALLBACK.title,
          description: json.description?.trim() || FALLBACK.description,
          submitLabel: json.submitLabel?.trim() || FALLBACK.submitLabel,
          successMessage: json.successMessage?.trim() || FALLBACK.successMessage,
        });
      } catch {
        // keep fallback
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch('/api/contact', { method: 'POST', body: data });
      if (!res.ok) {
        throw new Error('Failed to send message. Please try again.');
      }

      setStatus('success');
      form.reset();
    } catch (err: unknown) {
      let message = 'Something went wrong.';
      if (err instanceof Error && err.message) message = err.message;
      setError(message);
      setStatus('error');
    }
  }

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Contact form"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className={styles.panel}>
        <button
          type="button"
          className={styles.close}
          onClick={close}
          aria-label="Close contact form"
        >
          ✕
        </button>

        <div className={styles.scrollArea}>
          <p className={styles.kicker}>Contact</p>
          <h2 className={styles.title}>{config.title}</h2>
          <p className={styles.lead}>{config.description}</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span className={styles.labelText}>Your name *</span>
              <input name="name" placeholder="Your full name" required />
            </label>

            <label className={styles.field}>
              <span className={styles.labelText}>Email address *</span>
              <input name="email" type="email" placeholder="you@example.com" required />
            </label>

            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span className={styles.labelText}>Message *</span>
              <textarea name="message" placeholder="How can we help?" rows={4} required />
            </label>

            <button type="submit" className={styles.submit} disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : config.submitLabel}
            </button>

            {status === 'success' && <p className={styles.success}>{config.successMessage}</p>}
            {status === 'error' && <p className={styles.error}>{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ContactModal() {
  const { open } = useModals();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || open !== 'contact') return null;

  return createPortal(<ContactModalContent />, document.body);
}
