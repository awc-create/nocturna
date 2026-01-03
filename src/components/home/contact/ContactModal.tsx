'use client';

import { useEffect, useRef, useState } from 'react';
import { useModals } from '../modals/ModalContext';
import styles from './ContactModal.module.scss';
import HelpTip from '@/components/home/modals/HelpTip';

import type { ApiFormConfig, FormField } from '@/types/form-builder';
import { normalizeFields } from '@/lib/form-builder';
import {
  renderFieldControl,
  shouldShowField,
  type Values,
} from '@/components/home/modals/renderField';

type ContactConfig = {
  modalKicker: string;
  modalTitle: string;
  modalLead: string;
  submitLabel: string;
  successMessage: string;
  formFields: FormField[];
};

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const FALLBACK: ContactConfig = {
  modalKicker: 'Contact',
  modalTitle: 'Let’s talk.',
  modalLead:
    'Send a message and we’ll get back to you. If it’s urgent, include your phone number and best time to call.',
  submitLabel: 'Send message',
  successMessage: 'Thanks — your message has been sent.',
  formFields: [
    {
      id: 'topic',
      label: 'Topic *',
      name: 'topic',
      type: 'select',
      required: true,
      options: ['General', 'Bookings', 'Support'],
    },
    {
      id: 'name',
      label: 'Your name *',
      name: 'name',
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
      id: 'preferred_contact',
      label: 'Preferred contact method',
      name: 'preferred_contact',
      type: 'radio',
      required: false,
      options: ['Email', 'Phone'],
    },
    {
      id: 'best_time',
      label: 'Best time to reach you',
      name: 'best_time',
      type: 'select',
      required: false,
      options: ['Morning', 'Afternoon', 'Evening'],
      showIf: { field: 'preferred_contact', equals: 'Phone' },
    },
    {
      id: 'message',
      label: 'Message *',
      name: 'message',
      type: 'textarea',
      required: true,
      placeholder: 'How can we help?',
    },
  ],
};

function mapApiToModal(api: Partial<ApiFormConfig>): ContactConfig {
  const fields = normalizeFields(api.fields, 'contact');

  return {
    ...FALLBACK,
    modalTitle: (api.title ?? '').trim() || FALLBACK.modalTitle,
    modalLead: (api.intro ?? '').trim() || FALLBACK.modalLead,
    submitLabel: (api.submitLabel ?? '').trim() || FALLBACK.submitLabel,
    successMessage: (api.successMessage ?? '').trim() || FALLBACK.successMessage,
    formFields: fields.length ? fields : FALLBACK.formFields,
  };
}

export default function ContactModal() {
  const { open, close } = useModals();

  const [status, setStatus] = useState<FormState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ContactConfig>(FALLBACK);
  const [formValues, setFormValues] = useState<Values>({});

  const closeTimerRef = useRef<number | null>(null);
  const visible = open === 'contact';

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function resetState() {
    setStatus('idle');
    setError(null);
    setFormValues({});
  }

  // ESC key
  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, close]);

  // Lock scroll
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  // Hydrate config when modal opens (so it always reflects admin changes)
  useEffect(() => {
    if (!visible) return;

    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/home/contact', { cache: 'no-store' });
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
  }, [visible]);

  // Cleanup when closed
  useEffect(() => {
    if (visible) return;
    clearCloseTimer();
    resetState();
  }, [visible]);

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
      const res = await fetch('/api/contact', { method: 'POST', body: data });
      if (!res.ok) throw new Error('Unable to send message. Please try again.');

      setStatus('success');
      form.reset();
      setFormValues({});

      clearCloseTimer();
      closeTimerRef.current = window.setTimeout(() => close(), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error sending message.');
      setStatus('error');
    }
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Contact">
      <div className={styles.panel}>
        <button type="button" className={styles.close} onClick={close} aria-label="Close form">
          ✕
        </button>

        <div className={styles.scrollArea}>
          {status === 'success' ? (
            <div className={styles.successWrap}>
              <p className={styles.kicker}>{config.modalKicker}</p>
              <h2 className={styles.successTitle}>Message sent</h2>
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
                          <label htmlFor={`contact-${field.id}`} className={styles.labelText}>
                            {field.label}
                          </label>

                          {field.helpText ? (
                            <HelpTip text={field.helpText} label={`Help for ${field.label}`} />
                          ) : null}
                        </div>

                        {renderFieldControl(field, formValues, setFormValues, 'contact')}
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
