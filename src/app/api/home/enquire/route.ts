// src/app/api/home/enquire/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const KEY = 'enquire';

type FieldType = 'text' | 'textarea' | 'email' | 'tel' | 'date' | 'url' | 'select' | 'multiselect';

export type FormField = {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[]; // for select / multiselect
};

type EnquireConfig = {
  title: string; // maps to modalTitle
  intro: string; // maps to modalLead
  submitLabel: string; // maps to buttonLabel
  successMessage: string;
  fields: FormField[]; // maps to formFields JSON
};

const DEFAULT_FIELDS: FormField[] = [
  {
    id: 'name',
    name: 'name',
    label: 'Full name',
    type: 'text',
    required: true,
    placeholder: 'Your full name',
  },
  {
    id: 'email',
    name: 'email',
    label: 'Email address',
    type: 'email',
    required: true,
    placeholder: 'you@example.com',
  },
  {
    id: 'phone',
    name: 'phone',
    label: 'Mobile number',
    type: 'tel',
    required: true,
    placeholder: '+44…',
  },
  {
    id: 'venue',
    name: 'venue',
    label: 'Venue / event name',
    type: 'text',
    required: false,
    placeholder: 'e.g. Bar, restaurant or event name',
  },
  {
    id: 'message',
    name: 'message',
    label: 'Message',
    type: 'textarea',
    required: true,
    placeholder: 'Venue location, preferred days, timings, music brief, budget, tech notes…',
  },
];

const DEFAULT_CONFIG: EnquireConfig = {
  title: 'Enquire about DJs and live music.',
  intro:
    'Tell us about your venue or event – we’ll match you with the right artists and schedules.',
  submitLabel: 'Send enquiry',
  successMessage: 'Thanks – we’ll be in touch shortly.',
  fields: DEFAULT_FIELDS,
};

const sanitizeStr = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function sanitizeField(raw: unknown, idx: number): FormField | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const label = sanitizeStr(r.label) || `Field ${idx + 1}`;
  const name = sanitizeStr(r.name) || label.toLowerCase().replace(/\s+/g, '_');

  const typeRaw = sanitizeStr(r.type) as FieldType;
  const allowedTypes: FieldType[] = [
    'text',
    'textarea',
    'email',
    'tel',
    'date',
    'url',
    'select',
    'multiselect',
  ];
  const type = allowedTypes.includes(typeRaw) ? typeRaw : 'text';

  const required = Boolean(r.required);

  const placeholder = sanitizeStr(r.placeholder);
  const helpText = sanitizeStr(r.helpText);
  const id = sanitizeStr(r.id) || `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let options: string[] | undefined;
  if (type === 'select' || type === 'multiselect') {
    const rawOpts = r.options;
    if (Array.isArray(rawOpts)) {
      options = rawOpts.map((x) => sanitizeStr(x)).filter((x) => x.length > 0);
    }
  }

  return {
    id,
    name,
    label,
    type,
    required,
    placeholder: placeholder || undefined,
    helpText: helpText || undefined,
    options,
  };
}

function sanitizeConfig(body: Partial<EnquireConfig>): EnquireConfig {
  const fieldsRaw = Array.isArray(body.fields) ? body.fields : DEFAULT_FIELDS;

  const fields: FormField[] = fieldsRaw
    .map((f, i) => sanitizeField(f, i))
    .filter((f): f is FormField => !!f);

  return {
    title: sanitizeStr(body.title) || DEFAULT_CONFIG.title,
    intro: sanitizeStr(body.intro) || DEFAULT_CONFIG.intro,
    submitLabel: sanitizeStr(body.submitLabel) || DEFAULT_CONFIG.submitLabel,
    successMessage: sanitizeStr(body.successMessage) || DEFAULT_CONFIG.successMessage,
    fields: fields.length ? fields : DEFAULT_FIELDS,
  };
}

export async function GET() {
  try {
    const row = await prisma.homeEnquire.findUnique({
      where: { key: KEY },
    });

    if (!row) {
      return NextResponse.json(DEFAULT_CONFIG);
    }

    // use existing Prisma column `formFields`
    const fieldsRaw = (row.formFields ?? []) as unknown;
    const fields = (Array.isArray(fieldsRaw) ? fieldsRaw : DEFAULT_FIELDS)
      .map((f, i) => sanitizeField(f, i))
      .filter((f): f is FormField => !!f);

    // map Prisma columns -> API config shape
    const config: EnquireConfig = {
      title: row.modalTitle || row.title || DEFAULT_CONFIG.title,
      intro: row.modalLead || row.lead || DEFAULT_CONFIG.intro,
      submitLabel: row.buttonLabel || DEFAULT_CONFIG.submitLabel,
      successMessage: row.successMessage || DEFAULT_CONFIG.successMessage,
      fields: fields.length ? fields : DEFAULT_FIELDS,
    };

    return NextResponse.json(config);
  } catch (e) {
    console.error('GET /api/home/enquire failed:', e);
    return NextResponse.json({ error: 'Server error (GET enquire).' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<EnquireConfig>;
    const data = sanitizeConfig(body);

    const fieldsJson = data.fields as unknown as Prisma.JsonArray;

    const saved = await prisma.homeEnquire.upsert({
      where: { key: KEY },
      create: {
        key: KEY,
        // map API config -> Prisma columns
        modalTitle: data.title,
        modalLead: data.intro,
        buttonLabel: data.submitLabel,
        successMessage: data.successMessage,
        formFields: fieldsJson,
      },
      update: {
        modalTitle: data.title,
        modalLead: data.intro,
        buttonLabel: data.submitLabel,
        successMessage: data.successMessage,
        formFields: fieldsJson,
      },
    });

    revalidatePath('/');
    return NextResponse.json({ ok: true, id: saved.id });
  } catch (e) {
    console.error('POST /api/home/enquire failed:', e);
    return NextResponse.json({ error: 'Server error (POST enquire).' }, { status: 500 });
  }
}
