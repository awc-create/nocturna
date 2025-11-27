// src/app/api/home/join/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const KEY = 'join';

type FieldType = 'text' | 'textarea' | 'email' | 'tel' | 'date' | 'url' | 'select' | 'multiselect';

export type FormField = {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
};

type JoinConfig = {
  title: string; // -> modalTitle
  intro: string; // -> modalLead
  submitLabel: string; // -> buttonLabel
  successMessage: string;
  fields: FormField[]; // -> formFields
};

const DEFAULT_FIELDS: FormField[] = [
  {
    id: 'role',
    name: 'role',
    label: 'Are you a musician or DJ?',
    type: 'select',
    required: true,
    options: ['DJ', 'Musician'],
  },
  {
    id: 'instrument',
    name: 'instrument',
    label: 'If musician, what do you play?',
    type: 'text',
    required: false,
    placeholder: 'e.g. Saxophone, keys, percussion…',
  },
  {
    id: 'full_name',
    name: 'full_name',
    label: 'Full legal or birth name',
    type: 'text',
    required: true,
  },
  {
    id: 'address',
    name: 'address',
    label: 'Full address',
    type: 'textarea',
    required: true,
  },
  {
    id: 'email',
    name: 'email',
    label: 'Email address',
    type: 'email',
    required: true,
  },
  {
    id: 'phone',
    name: 'phone',
    label: 'Mobile number',
    type: 'tel',
    required: true,
  },
  {
    id: 'dob',
    name: 'dob',
    label: 'Date of birth',
    type: 'date',
    required: true,
  },
  {
    id: 'website',
    name: 'website',
    label: 'Website',
    type: 'url',
    required: false,
  },
  {
    id: 'youtube',
    name: 'youtube',
    label: 'YouTube',
    type: 'url',
    required: false,
  },
  {
    id: 'soundcloud',
    name: 'soundcloud',
    label: 'SoundCloud',
    type: 'url',
    required: false,
  },
  {
    id: 'current_venues',
    name: 'current_venues',
    label: 'Where do you currently play?',
    type: 'textarea',
    required: false,
  },
  {
    id: 'equipment',
    name: 'equipment',
    label: 'What PA & equipment do you have?',
    type: 'textarea',
    required: false,
  },
  {
    id: 'referral',
    name: 'referral',
    label: 'How did you hear about us?',
    type: 'text',
    required: false,
  },
  {
    id: 'genres',
    name: 'genres',
    label: 'What is / are your favourite genres to play?',
    type: 'textarea',
    required: false,
  },
  {
    id: 'venues_pref',
    name: 'venues_pref',
    label: 'Which of the venues would you like to play?',
    type: 'textarea',
    required: false,
    placeholder: 'If you know: rooftop, lounge, restaurant, bar, hotel, etc.',
  },
];

const DEFAULT_CONFIG: JoinConfig = {
  title: 'Join the Nocturna roster',
  intro:
    'Tell us who you are, what you play, and where you’re performing now. We review every application carefully.',
  submitLabel: 'Apply to join',
  successMessage: 'Thanks – we’ll review your application and get back to you if there’s a fit.',
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

function sanitizeConfig(body: Partial<JoinConfig>): JoinConfig {
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
    const row = await prisma.homeJoin.findUnique({
      where: { key: KEY },
    });

    if (!row) {
      return NextResponse.json(DEFAULT_CONFIG);
    }

    const fieldsRaw = (row.formFields ?? []) as unknown;
    const fields = (Array.isArray(fieldsRaw) ? fieldsRaw : DEFAULT_FIELDS)
      .map((f, i) => sanitizeField(f, i))
      .filter((f): f is FormField => !!f);

    const config: JoinConfig = {
      title: row.modalTitle || row.title || DEFAULT_CONFIG.title,
      intro: row.modalLead || row.lead || DEFAULT_CONFIG.intro,
      submitLabel: row.buttonLabel || DEFAULT_CONFIG.submitLabel,
      successMessage: row.successMessage || DEFAULT_CONFIG.successMessage,
      fields: fields.length ? fields : DEFAULT_FIELDS,
    };

    return NextResponse.json(config);
  } catch (e) {
    console.error('GET /api/home/join failed:', e);
    return NextResponse.json({ error: 'Server error (GET join).' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<JoinConfig>;
    const data = sanitizeConfig(body);

    const fieldsJson = data.fields as unknown as Prisma.JsonArray;

    const saved = await prisma.homeJoin.upsert({
      where: { key: KEY },
      create: {
        key: KEY,
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
    console.error('POST /api/home/join failed:', e);
    return NextResponse.json({ error: 'Server error (POST join).' }, { status: 500 });
  }
}
