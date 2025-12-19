'use client';

import { useEffect, useState } from 'react';
import { useModals } from '../modals/ModalContext';
import styles from './EnquireModal.module.scss';

const GOOGLE_BOOKING_URL = process.env.NEXT_PUBLIC_GOOGLE_BOOKING_URL || '';

type FormFieldType = 'text' | 'email' | 'tel' | 'textarea';

type FormField = {
  id: string;
  label: string;
  name: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
};

type EnquireConfig = {
  modalKicker: string;
  modalTitle: string;
  modalLead: string;
  successMessage: string;
  formFields: FormField[];
};

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const FALLBACK: EnquireConfig = {
  modalKicker: 'Enquire Now',
  modalTitle: 'Tell us about your venue or event.',
  modalLead:
    'Share a few details about your space, schedule and music brief — we’ll match you with the right artists.',
  successMessage: 'Thanks — we’ll be in touch shortly.',
  formFields: [
    {
      id: 'name',
      label: 'Full legal or birth name *',
      name: 'name',
      type: 'text',
      required: true,
      placeholder: 'Your full name',
    },
    {
      id: 'email',
      label: 'Email address *',
      name: 'email',
      type: 'email',
      required: true,
      placeholder: 'you@example.com',
    },
    {
      id: 'phone',
      label: 'Mobile number *',
      name: 'phone',
      type: 'tel',
      required: true,
      placeholder: '+44…',
    },
    {
      id: 'message',
      label: 'Message *',
      name: 'message',
      type: 'textarea',
      required: true,
      placeholder: 'Venue name, location, preferred days, music style, budget, tech notes…',
    },
  ],
};

export default function EnquireModal() {
  const { open, close } = useModals();
  const [status, setStatus] = useState<FormState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<EnquireConfig>(FALLBACK);

  const visible = open === 'enquire';

  // Lock body scroll when open
  useEffect(() => {
    if (visible) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return () => {};
  }, [visible]);

  // Hydrate config from API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/home/enquire', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as Partial<EnquireConfig>;
        if (!mounted) return;
        const fields = (json.formFields ?? FALLBACK.formFields).map((fld, idx) => ({
          ...fld,
          id: fld.id || fld.name || `f_${idx}_${Math.random().toString(36).slice(2, 9)}`,
        }));
        setConfig({
          ...FALLBACK,
          ...json,
          formFields: fields,
        });
      } catch {
        // fallback only
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!visible) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch('/api/enquire', { method: 'POST', body: data });
      if (!res.ok) throw new Error('Unable to send enquiry. Please try again.');

      setStatus('success');
      form.reset();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error submitting enquiry.');
      }
      setStatus('error');
    }
  }

  const renderField = (field: FormField) => {
    const commonProps = {
      id: `enq-${field.id}`,
      name: field.name,
      required: field.required,
      placeholder: field.placeholder,
    };

    if (field.type === 'textarea') {
      return <textarea {...commonProps} rows={4} />;
    }

    return <input {...commonProps} type={field.type} />;
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Enquire now"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className={styles.panel}>
        <button
          type="button"
          className={styles.close}
          onClick={close}
          aria-label="Close enquiry form"
        >
          ✕
        </button>

        <div className={styles.scrollArea}>
          <p className={styles.kicker}>{config.modalKicker}</p>
          <h2 className={styles.title}>{config.modalTitle}</h2>
          <p className={styles.lead}>{config.modalLead}</p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
              {config.formFields.map((field) => {
                const isWide = field.type === 'textarea';
                return (
                  <div
                    key={field.id}
                    className={`${styles.field} ${isWide ? styles.fieldFull : ''}`}
                  >
                    <label htmlFor={`enq-${field.id}`}>
                      <span className={styles.labelText}>{field.label}</span>
                      {renderField(field)}
                    </label>
                  </div>
                );
              })}
            </div>

            <button type="submit" className={styles.submit} disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : 'Send Enquiry'}
            </button>

            {status === 'success' && (
              <>
                <p className={styles.success}>{config.successMessage}</p>

                {GOOGLE_BOOKING_URL && (
                  <a
                    href={GOOGLE_BOOKING_URL}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.bookingCta}
                  >
                    Book a call in our calendar
                  </a>
                )}
              </>
            )}

            {status === 'error' && <p className={styles.error}>{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
