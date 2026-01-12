// src/app/api/home/contact/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const KEY = 'contact';

type SocialPlatform =
  | 'instagram'
  | 'x'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'facebook'
  | 'soundcloud';

export type SocialLink = { platform: SocialPlatform; url: string };

type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'checkboxgroup'
  | 'radio'
  | 'file';

export type FormField = {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;

  placeholder?: string;
  helpText?: string;

  options?: string[];

  min?: number;
  max?: number;
  step?: number;

  accept?: string;
  multipleFiles?: boolean;

  showIf?: { field: string; equals: string };
};

export type ContactConfig = {
  // section
  eyebrow: string;
  title: string;
  lead: string;
  buttonLabel: string;

  // public details (shown on site)
  contactEmail: string; // allow "" to mean “hidden”
  contactPhone?: string | null;

  // delivery (where emails go)
  recipientEmail?: string | null;

  // modal
  modalKicker: string;
  modalTitle: string;
  modalLead: string;
  submitLabel: string;
  successMessage: string;

  // socials + fields
  socialLinks: SocialLink[];
  fields: FormField[];
};

const DEFAULT_FIELDS: FormField[] = [
  { id: 'name', name: 'name', label: 'Your name', type: 'text', required: true },
  { id: 'email', name: 'email', label: 'Email address', type: 'email', required: true },
  { id: 'message', name: 'message', label: 'Message', type: 'textarea', required: true },
];

const DEFAULT_CONFIG: ContactConfig = {
  eyebrow: "LET'S CONNECT",
  title: 'Get in touch',
  lead: 'General enquiries',
  buttonLabel: 'Open contact form',

  contactEmail: '', // IMPORTANT: empty = hide
  contactPhone: null,

  recipientEmail: null,

  modalKicker: 'Contact',
  modalTitle: 'Send us a message.',
  modalLead: 'We’ll get back to you shortly.',
  submitLabel: 'Send message',
  successMessage: 'Thanks — we’ll be in touch soon.',

  socialLinks: [],
  fields: DEFAULT_FIELDS,
};

/** -----------------------------
 *  Guards / sanitizers
 *  ---------------------------- */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

function isFieldType(v: string): v is FieldType {
  return (
    v === 'text' ||
    v === 'textarea' ||
    v === 'email' ||
    v === 'tel' ||
    v === 'url' ||
    v === 'number' ||
    v === 'date' ||
    v === 'time' ||
    v === 'datetime' ||
    v === 'select' ||
    v === 'multiselect' ||
    v === 'checkbox' ||
    v === 'checkboxgroup' ||
    v === 'radio' ||
    v === 'file'
  );
}

function isSocialPlatform(v: string): v is SocialPlatform {
  return (
    v === 'instagram' ||
    v === 'x' ||
    v === 'tiktok' ||
    v === 'youtube' ||
    v === 'linkedin' ||
    v === 'facebook' ||
    v === 'soundcloud'
  );
}

function parseJsonArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function sanitizeField(raw: unknown, idx: number): FormField | null {
  if (!isRecord(raw)) return null;

  const label = str(raw.label) || `Field ${idx + 1}`;
  const name = str(raw.name) || label.toLowerCase().replace(/\s+/g, '_');
  const typeRaw = str(raw.type);
  const type: FieldType = isFieldType(typeRaw) ? typeRaw : 'text';

  const out: FormField = {
    id: str(raw.id) || `contact_${name}_${idx}`,
    name,
    label,
    type,
    required: Boolean(raw.required),
  };

  const placeholder = str(raw.placeholder);
  const helpText = str(raw.helpText);
  if (placeholder) out.placeholder = placeholder;
  if (helpText) out.helpText = helpText;

  const needsOptions = type === 'select' || type === 'multiselect' || type === 'radio';
  if (needsOptions && Array.isArray(raw.options)) {
    const opts = raw.options.map((x) => str(x)).filter(Boolean);
    if (opts.length) out.options = opts;
  }

  if (type === 'number') {
    const min = num(raw.min);
    const max = num(raw.max);
    const step = num(raw.step);
    if (min !== undefined) out.min = min;
    if (max !== undefined) out.max = max;
    if (step !== undefined) out.step = step;
  }

  if (type === 'file') {
    const accept = str(raw.accept);
    if (accept) out.accept = accept;
    out.multipleFiles = Boolean(raw.multipleFiles) || undefined;
  }

  if (isRecord(raw.showIf)) {
    const f = str(raw.showIf.field);
    const eq = str(raw.showIf.equals);
    if (f && eq) out.showIf = { field: f, equals: eq };
  }

  return out.name ? out : null;
}

function sanitizeSocialLinks(raw: unknown): SocialLink[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((x) => (isRecord(x) ? x : null))
    .filter(Boolean)
    .map((x) => {
      const r = x as Record<string, unknown>;
      const platform = str(r.platform);
      const url = str(r.url);
      if (!platform || !url) return null;
      if (!isSocialPlatform(platform)) return null;
      return { platform, url } satisfies SocialLink;
    })
    .filter((x): x is SocialLink => Boolean(x));
}

function sanitizeConfig(body: unknown): ContactConfig {
  const b = isRecord(body) ? body : {};

  const fieldsRaw = Array.isArray(b.fields) ? b.fields : DEFAULT_FIELDS;
  const fields = fieldsRaw
    .map((f, i) => sanitizeField(f, i))
    .filter((f): f is FormField => Boolean(f));

  const socialLinks = sanitizeSocialLinks(b.socialLinks);

  return {
    eyebrow: str(b.eyebrow) || DEFAULT_CONFIG.eyebrow,
    title: str(b.title) || DEFAULT_CONFIG.title,
    lead: str(b.lead) || DEFAULT_CONFIG.lead,
    buttonLabel: str(b.buttonLabel) || DEFAULT_CONFIG.buttonLabel,

    // allow "" to hide email icon entirely
    contactEmail: str(b.contactEmail),
    contactPhone: str(b.contactPhone) || null,

    recipientEmail: str(b.recipientEmail) || null,

    modalKicker: str(b.modalKicker) || DEFAULT_CONFIG.modalKicker,
    modalTitle: str(b.modalTitle) || DEFAULT_CONFIG.modalTitle,
    modalLead: str(b.modalLead) || DEFAULT_CONFIG.modalLead,
    submitLabel: str(b.submitLabel) || DEFAULT_CONFIG.submitLabel,
    successMessage: str(b.successMessage) || DEFAULT_CONFIG.successMessage,

    socialLinks,
    fields: fields.length ? fields : DEFAULT_FIELDS,
  };
}

/** -----------------------------
 *  Handlers
 *  ---------------------------- */
export async function GET() {
  try {
    const row = await prisma.homeContact.findUnique({ where: { key: KEY } });
    if (!row) return NextResponse.json(DEFAULT_CONFIG);

    const fieldsRaw = parseJsonArray(row.formFields);
    const fields = (fieldsRaw.length ? fieldsRaw : DEFAULT_FIELDS)
      .map((f, i) => sanitizeField(f, i))
      .filter((f): f is FormField => Boolean(f));

    const socialsRaw = parseJsonArray(row.socialLinks);
    const socialLinks = sanitizeSocialLinks(socialsRaw);

    const config: ContactConfig = {
      eyebrow: row.eyebrow || DEFAULT_CONFIG.eyebrow,
      title: row.title || DEFAULT_CONFIG.title,
      lead: row.lead || DEFAULT_CONFIG.lead,
      buttonLabel: row.buttonLabel || DEFAULT_CONFIG.buttonLabel,

      // allow blank
      contactEmail: (row.contactEmail ?? '').trim(),
      contactPhone: row.contactPhone ?? null,

      recipientEmail: row.recipientEmail ?? null,

      modalKicker: row.modalKicker || DEFAULT_CONFIG.modalKicker,
      modalTitle: row.modalTitle || DEFAULT_CONFIG.modalTitle,
      modalLead: row.modalLead || DEFAULT_CONFIG.modalLead,
      submitLabel: row.submitLabel || DEFAULT_CONFIG.submitLabel,
      successMessage: row.successMessage || DEFAULT_CONFIG.successMessage,

      socialLinks,
      fields: fields.length ? fields : DEFAULT_FIELDS,
    };

    return NextResponse.json(config);
  } catch (e) {
    console.error('GET /api/home/contact failed:', e);
    return NextResponse.json({ error: 'Server error (GET contact).' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const data = sanitizeConfig(body);

    const fieldsJson: Prisma.InputJsonValue = data.fields as unknown as Prisma.InputJsonValue;
    const socialsJson: Prisma.InputJsonValue = data.socialLinks as unknown as Prisma.InputJsonValue;

    const saved = await prisma.homeContact.upsert({
      where: { key: KEY },
      create: {
        key: KEY,

        eyebrow: data.eyebrow,
        title: data.title,
        lead: data.lead,
        buttonLabel: data.buttonLabel,

        contactEmail: data.contactEmail, // can be ""
        contactPhone: data.contactPhone,
        recipientEmail: data.recipientEmail,

        modalKicker: data.modalKicker,
        modalTitle: data.modalTitle,
        modalLead: data.modalLead,
        submitLabel: data.submitLabel,
        successMessage: data.successMessage,

        socialLinks: socialsJson,
        formFields: fieldsJson,
      },
      update: {
        eyebrow: data.eyebrow,
        title: data.title,
        lead: data.lead,
        buttonLabel: data.buttonLabel,

        contactEmail: data.contactEmail, // can be ""
        contactPhone: data.contactPhone,
        recipientEmail: data.recipientEmail,

        modalKicker: data.modalKicker,
        modalTitle: data.modalTitle,
        modalLead: data.modalLead,
        submitLabel: data.submitLabel,
        successMessage: data.successMessage,

        socialLinks: socialsJson,
        formFields: fieldsJson,
      },
    });

    // Revalidate whatever pages include Contact section
    revalidatePath('/');
    return NextResponse.json({ ok: true, id: saved.id });
  } catch (e) {
    console.error('POST /api/home/contact failed:', e);
    return NextResponse.json({ error: 'Server error (POST contact).' }, { status: 500 });
  }
}
