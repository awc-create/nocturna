// src/components/home/enquire/EnquireModal.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useModals } from '../modals/ModalContext';
import styles from './EnquireModal.module.scss';
import HelpTip from '@/components/home/modals/HelpTip';

import type { ApiFormConfig, FormField } from '@/types/form-builder';
import { normalizeFields } from '@/lib/form-builder';
import {
  renderFieldControl,
  shouldShowField,
  type Values,
} from '@/components/home/modals/renderField';

type EnquireConfig = {
  modalKicker: string;
  modalTitle: string;
  modalLead: string;
  submitLabel: string;
  successMessage: string;
  formFields: FormField[];
};

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const FALLBACK: EnquireConfig = {
  modalKicker: 'Enquire',
  modalTitle: 'Tell us what you need.',
  modalLead:
    'Send us your event details, dates and location. We’ll respond with availability and next steps.',
  submitLabel: 'Send Enquiry',
  successMessage: 'Thanks — we’ll be in touch shortly.',
  formFields: [
    {
      id: 'enq_type',
      label: 'What are you enquiring about? *',
      name: 'enq_type',
      type: 'radio',
      required: true,
      options: ['Booking', 'Partnership', 'General'],
    },
    {
      id: 'contact_name',
      label: 'Your name *',
      name: 'contact_name',
      type: 'text',
      required: true,
      placeholder: 'Full name',
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
      label: 'Phone number',
      name: 'phone',
      type: 'tel',
      required: false,
      placeholder: '+44…',
    },
    {
      id: 'venue',
      label: 'Venue / organisation',
      name: 'venue',
      type: 'text',
      required: false,
      placeholder: 'Venue name',
    },
    {
      id: 'event_date',
      label: 'Event date',
      name: 'event_date',
      type: 'date',
      required: false,
    },
    {
      id: 'event_time',
      label: 'Event time',
      name: 'event_time',
      type: 'time',
      required: false,
    },
    {
      id: 'location',
      label: 'Event location',
      name: 'location',
      type: 'text',
      required: false,
      placeholder: 'City / country',
    },
    {
      id: 'budget',
      label: 'Budget (optional)',
      name: 'budget',
      type: 'select',
      required: false,
      options: ['Under £500', '£500–£1,000', '£1,000–£2,500', '£2,500+'],
    },
    {
      id: 'message',
      label: 'Details *',
      name: 'message',
      type: 'textarea',
      required: true,
      placeholder: 'Tell us about the event, audience, requirements…',
    },
    {
      id: 'dj_count',
      label: 'How many DJs / acts?',
      name: 'dj_count',
      type: 'number',
      required: false,
      min: 1,
      max: 20,
      step: 1,
      showIf: { field: 'enq_type', equals: 'Booking' },
    },
  ],
};

function mapApiToModal(api: Partial<ApiFormConfig>): EnquireConfig {
  const fields = normalizeFields(api.fields, 'enquire');

  return {
    ...FALLBACK,
    modalTitle: (api.title ?? '').trim() || FALLBACK.modalTitle,
    modalLead: (api.intro ?? '').trim() || FALLBACK.modalLead,
    submitLabel: (api.submitLabel ?? '').trim() || FALLBACK.submitLabel,
    successMessage: (api.successMessage ?? '').trim() || FALLBACK.successMessage,
    formFields: fields.length ? fields : FALLBACK.formFields,
  };
}

export default function EnquireModal() {
  const { open, close } = useModals();

  const [status, setStatus] = useState<FormState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<EnquireConfig>(FALLBACK);
  const [formValues, setFormValues] = useState<Values>({});

  const closeTimerRef = useRef<number | null>(null);

  const visible = open === 'enquire';

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function resetFormState() {
    setStatus('idle');
    setError(null);
    setFormValues({});
  }

  // ESC handling
  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, close]);

  // Lock background scroll
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  // Hydrate config
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch('/api/home/enquire', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as Partial<ApiFormConfig>;
        if (!mounted) return;
        setConfig(mapApiToModal(json));
      } catch {
        // keep fallback
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // When modal closes, cleanup timer + reset state so it opens fresh next time
  useEffect(() => {
    if (visible) return;
    clearCloseTimer();
    resetFormState();
  }, [visible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearCloseTimer();
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
      setFormValues({});

      // ✅ auto close after 5s
      clearCloseTimer();
      closeTimerRef.current = window.setTimeout(() => {
        close();
      }, 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error sending enquiry.');
      setStatus('error');
    }
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Enquire">
      <div className={styles.panel}>
        <button type="button" className={styles.close} onClick={close} aria-label="Close form">
          ✕
        </button>

        <div className={styles.scrollArea}>
          {status === 'success' ? (
            // ✅ compact thank-you view
            <div className={styles.successWrap}>
              <p className={styles.kicker}>{config.modalKicker}</p>
              <h2 className={styles.successTitle}>Enquiry sent</h2>
              <p className={styles.successLead}>{config.successMessage}</p>
              <div className={styles.successPill}>
                Closing in <span className={styles.successCount}>5s</span>
              </div>

              <button type="button" className={styles.successCloseBtn} onClick={close}>
                Close now
              </button>
            </div>
          ) : (
            <>
              <p className={styles.kicker}>{config.modalKicker}</p>
              <h2 className={styles.title}>{config.modalTitle}</h2>
              <p className={styles.lead}>{config.modalLead}</p>

              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.grid}>
                  {config.formFields.map((field) => {
                    if (!shouldShowField(field, formValues)) return null;

                    const isWide =
                      field.type === 'textarea' ||
                      field.type === 'checkboxes' ||
                      field.type === 'file';

                    return (
                      <div
                        key={field.id}
                        className={`${styles.field} ${isWide ? styles.fieldFull : ''}`}
                      >
                        <div className={styles.labelRow}>
                          <label htmlFor={`enquire-${field.id}`} className={styles.labelText}>
                            {field.label}
                          </label>

                          {field.helpText ? (
                            <HelpTip text={field.helpText} label={`Help for ${field.label}`} />
                          ) : null}
                        </div>

                        {renderFieldControl(field, formValues, setFormValues, 'enquire')}
                      </div>
                    );
                  })}
                </div>

                <button type="submit" className={styles.submit} disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'Sending…' : config.submitLabel}
                </button>

                {status === 'error' && <p className={styles.error}>{error}</p>}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
