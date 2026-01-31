'use client';

import { useEffect, useRef, useState } from 'react';
import { useModals } from '../modals/ModalContext';
import styles from './JoinModal.module.scss';
import HelpTip from '@/components/home/modals/HelpTip';

import type { ApiFormConfig, FormField } from '@/types/form-builder';
import { normalizeFields } from '@/lib/form-builder';
import {
  renderFieldControl,
  shouldShowField,
  type Values,
} from '@/components/home/modals/renderField';

type JoinConfig = {
  modalKicker: string;
  modalTitle: string;
  modalLead: string;
  submitLabel: string;
  successMessage: string;
  formFields: FormField[];
};

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const FALLBACK: JoinConfig = {
  modalKicker: 'Join Essentia',
  modalTitle: 'Tell us about your sound.',
  modalLead:
    'Tell us who you are, what you play, and where you’re currently performing. We’ll review every application carefully.',
  submitLabel: 'Send Application',
  successMessage: 'Thanks — we’ll review your submission and follow up.',
  formFields: [
    {
      id: 'role',
      label: 'Role *',
      name: 'role',
      type: 'select',
      required: true,
      placeholder: 'Select your role',
      options: ['DJ', 'Musician'],
    },
    {
      id: 'instrument',
      label: 'Instrument (if musician)',
      name: 'instrument',
      type: 'text',
      required: false,
      placeholder: 'e.g. Saxophone, keys, percussion…',
      showIf: { field: 'role', equals: 'Musician' },
    },
    {
      id: 'full_name',
      label: 'Full legal name *',
      name: 'full_name',
      type: 'text',
      required: true,
      placeholder: 'As on your ID / passport',
    },
    {
      id: 'address',
      label: 'Full address *',
      name: 'address',
      type: 'textarea',
      required: true,
      placeholder: 'House number, street, city, postcode',
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
      id: 'dob',
      label: 'Date of birth *',
      name: 'dob',
      type: 'date',
      required: true,
    },
    {
      id: 'website',
      label: 'Website',
      name: 'website',
      type: 'url',
      required: false,
      placeholder: 'https://your-site.com',
    },
    {
      id: 'soundcloud',
      label: 'SoundCloud',
      name: 'soundcloud',
      type: 'url',
      required: false,
      placeholder: 'Profile link',
    },
    {
      id: 'genres',
      label: 'Favourite genres to play?',
      name: 'genres',
      type: 'text',
      required: false,
      placeholder: 'e.g. soulful house, amapiano, R&B…',
    },
  ],
};

function mapApiToModal(api: Partial<ApiFormConfig>): JoinConfig {
  const fields = normalizeFields(api.fields, 'join');

  return {
    ...FALLBACK,
    modalTitle: (api.title ?? '').trim() || FALLBACK.modalTitle,
    modalLead: (api.intro ?? '').trim() || FALLBACK.modalLead,
    submitLabel: (api.submitLabel ?? '').trim() || FALLBACK.submitLabel,
    successMessage: (api.successMessage ?? '').trim() || FALLBACK.successMessage,
    formFields: fields.length ? fields : FALLBACK.formFields,
  };
}

export default function JoinModal() {
  const { open, close } = useModals();

  const [status, setStatus] = useState<FormState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<JoinConfig>(FALLBACK);
  const [formValues, setFormValues] = useState<Values>({});

  const closeTimerRef = useRef<number | null>(null);
  const visible = open === 'join';

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

  // ESC
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

  // Hydrate config when open
  useEffect(() => {
    if (!visible) return;

    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/home/join', { cache: 'no-store' });
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
      const res = await fetch('/api/join', { method: 'POST', body: data });
      if (!res.ok) throw new Error('Unable to send application. Please try again.');

      setStatus('success');
      form.reset();
      setFormValues({});

      clearCloseTimer();
      closeTimerRef.current = window.setTimeout(() => close(), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error submitting application.');
      setStatus('error');
    }
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Join">
      <div className={styles.panel}>
        <button type="button" className={styles.close} onClick={close} aria-label="Close form">
          ✕
        </button>

        <div className={styles.scrollArea}>
          {status === 'success' ? (
            <div className={styles.successWrap}>
              <p className={styles.kicker}>{config.modalKicker}</p>
              <h2 className={styles.successTitle}>Application sent</h2>
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
                          <label htmlFor={`join-${field.id}`} className={styles.labelText}>
                            {field.label}
                          </label>

                          {field.helpText ? (
                            <HelpTip text={field.helpText} label={`Help for ${field.label}`} />
                          ) : null}
                        </div>

                        {renderFieldControl(field, formValues, setFormValues, 'join')}
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
