// src/components/home/join/JoinModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { useModals } from '../modals/ModalContext';
import styles from './JoinModal.module.scss';

type FormFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'url';

type ShowIf = {
  field: string;
  equals: string;
};

type FormField = {
  id: string;
  label: string;
  name: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // for select / multiselect
  showIf?: ShowIf; // simple conditional visibility
};

type JoinConfig = {
  modalKicker: string;
  modalTitle: string;
  modalLead: string;
  successMessage: string;
  formFields: FormField[];
};

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const FALLBACK: JoinConfig = {
  modalKicker: 'Join Nocturna',
  modalTitle: 'Tell us about your sound.',
  modalLead:
    'Tell us who you are, what you play, and where you’re currently performing. We’ll review every application carefully.',
  successMessage: 'Thanks — we’ll review your submission and follow up.',
  formFields: [
    // Role (select: DJ / Musician)
    {
      id: 'role',
      label: 'Role *',
      name: 'role',
      type: 'select',
      required: true,
      placeholder: 'Select your role',
      options: ['DJ', 'Musician'],
    },
    // Instrument (only when Musician)
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
      id: 'youtube',
      label: 'YouTube',
      name: 'youtube',
      type: 'url',
      required: false,
      placeholder: 'Channel or main video link',
    },
    {
      id: 'soundcloud',
      label: 'SoundCloud',
      name: 'soundcloud',
      type: 'url',
      required: false,
      placeholder: 'Profile or playlist link',
    },
    {
      id: 'current_venues',
      label: 'Where do you currently play?',
      name: 'current_venues',
      type: 'textarea',
      required: false,
      placeholder: 'Residencies, venues, events…',
    },
    {
      id: 'equipment',
      label: 'What PA & equipment do you have?',
      name: 'equipment',
      type: 'textarea',
      required: false,
      placeholder: 'e.g. controllers, mixers, speakers, instruments…',
    },
    {
      id: 'referral',
      label: 'How did you hear about us?',
      name: 'referral',
      type: 'text',
      required: false,
      placeholder: 'Friend, venue, Instagram, TikTok…',
    },
    {
      id: 'genres',
      label: 'Favourite genres to play?',
      name: 'genres',
      type: 'text',
      required: false,
      placeholder: 'e.g. soulful house, amapiano, R&B, afrobeats…',
    },
    {
      id: 'venues_pref',
      label: 'Which venues would you like to play?',
      name: 'venues_pref',
      type: 'textarea',
      required: false,
      placeholder: 'Name venues or describe types of venues you’d like to play.',
    },
  ],
};

export default function JoinModal() {
  const { open, close } = useModals();
  const [status, setStatus] = useState<FormState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<JoinConfig>(FALLBACK);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const visible = open === 'join';

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

  // Hydrate config from API (can override fallback fields later)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/home/join', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as Partial<JoinConfig>;
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
        // keep fallback
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
      const res = await fetch('/api/join', { method: 'POST', body: data });
      if (!res.ok) throw new Error('Unable to send application. Please try again.');

      setStatus('success');
      form.reset();
      setFormValues({});
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error submitting application.');
      }
      setStatus('error');
    }
  }

  const handleValueChange =
    (field: FormField) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
        | React.ChangeEvent<HTMLSelectElement>
    ) => {
      let value = '';

      if (field.type === 'multiselect' && e.target instanceof HTMLSelectElement) {
        value = Array.from(e.target.selectedOptions)
          .map((opt) => opt.value)
          .join(',');
      } else {
        value = e.target.value;
      }

      setFormValues((prev) => ({
        ...prev,
        [field.name]: value,
      }));
    };

  const renderField = (field: FormField) => {
    // Conditional visibility (e.g. Instrument only when Role = Musician)
    if (field.showIf) {
      const controllingValue = formValues[field.showIf.field] ?? '';
      if (controllingValue !== field.showIf.equals) {
        return null;
      }
    }

    const baseId = `join-${field.id}`;

    if (field.type === 'textarea') {
      return (
        <textarea
          id={baseId}
          name={field.name}
          required={field.required}
          placeholder={field.placeholder}
          rows={4}
          onChange={handleValueChange(field)}
        />
      );
    }

    if (field.type === 'select' || field.type === 'multiselect') {
      return (
        <select
          id={baseId}
          name={field.name}
          required={field.required}
          multiple={field.type === 'multiselect'}
          onChange={handleValueChange(field)}
        >
          {field.type === 'select' && <option value="">Select…</option>}
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    const inputType = field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : field.type; // text | email | tel

    return (
      <input
        id={baseId}
        name={field.name}
        required={field.required}
        placeholder={field.placeholder}
        type={inputType}
        onChange={handleValueChange(field)}
      />
    );
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Join Nocturna"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className={styles.panel}>
        <button
          type="button"
          className={styles.close}
          onClick={close}
          aria-label="Close application form"
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
                const control = renderField(field);
                if (!control) return null;

                const isWide = field.type === 'textarea';

                return (
                  <div
                    key={field.id}
                    className={`${styles.field} ${isWide ? styles.fieldFull : ''}`}
                  >
                    <label htmlFor={`join-${field.id}`}>
                      <span className={styles.labelText}>{field.label}</span>
                      {control}
                    </label>
                  </div>
                );
              })}
            </div>

            <button type="submit" className={styles.submit} disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending…' : 'Send Application'}
            </button>

            {status === 'success' && <p className={styles.success}>{config.successMessage}</p>}
            {status === 'error' && <p className={styles.error}>{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
