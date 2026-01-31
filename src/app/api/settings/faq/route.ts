import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const KEY = 'faq';

type FaqCtaType = 'none' | 'enquire' | 'join' | 'contact';

type FaqItem = {
  id: string;
  category?: string;
  question: string;
  answer: string;
  ctaType?: FaqCtaType;
  ctaLabel?: string;
};

type FaqConfig = {
  eyebrow: string;
  title: string;
  lead: string;
  items: FaqItem[];
};

const DEFAULT_ITEMS: FaqItem[] = [
  {
    id: 'venues-1',
    category: 'For venues & events',
    question: 'What kind of venues do you work with?',
    answer:
      'We curate music for restaurants, bars, rooftops, lounges, members’ clubs and private events. The focus is always on atmosphere – matching the music to your brand, guest profile and schedule.',
    ctaType: 'enquire',
    ctaLabel: 'Enquire about a booking',
  },
  {
    id: 'venues-2',
    category: 'For venues & events',
    question: 'How does the booking process work?',
    answer:
      'Start by sending an enquiry with details about your venue, schedule and music brief. We’ll follow up with a short call, then propose artists and a music direction. Once approved, we lock in dates and send a simple agreement.',
    ctaType: 'enquire',
    ctaLabel: 'Open enquiry form',
  },
  {
    id: 'artists-1',
    category: 'For artists',
    question: 'How do I join the Essentia roster?',
    answer:
      'Use the “Join the roster” form on the homepage to share your links, current venues and a short intro. We review every application carefully and will be in touch if there is a suitable fit.',
    ctaType: 'join',
    ctaLabel: 'Apply to join',
  },
  {
    id: 'general-1',
    category: 'General',
    question: 'I still have questions that aren’t covered here.',
    answer:
      'No problem. You can contact us directly and we’ll route your message to the right person on the team.',
    ctaType: 'contact',
    ctaLabel: 'Contact us',
  },
  // No-CTA defaults
  {
    id: 'general-2',
    category: 'General',
    question: 'What areas do you currently cover?',
    answer:
      'We work primarily across the UK with a core presence in major cities. For international bookings, please include travel details in your enquiry and we’ll confirm what’s possible.',
    ctaType: 'none',
  },
  {
    id: 'general-3',
    category: 'General',
    question: 'Do you help with sound or equipment?',
    answer:
      'We provide guidance on DJ booth layout, PA requirements and basic equipment choices. For full production setups such as lighting or larger PAs, we collaborate with trusted partners.',
    ctaType: 'none',
  },
  {
    id: 'general-4',
    category: 'General',
    question: 'Can you provide DJs and musicians for private events?',
    answer:
      'Yes. We regularly curate music for private dinners, brand activations, corporate events and intimate functions, always matching the atmosphere you want to create.',
    ctaType: 'none',
  },
  {
    id: 'general-5',
    category: 'General',
    question: 'How far in advance should we book?',
    answer:
      'For residencies, earlier is always better. One-off events are typically booked 1–4 weeks in advance, though we can often accommodate shorter notice depending on artist availability.',
    ctaType: 'none',
  },
];

const DEFAULT_CONFIG: FaqConfig = {
  eyebrow: 'Help centre',
  title: 'Frequently asked questions.',
  lead: 'A quick guide for venues, events and artists working with Essentia. If you can’t find what you’re looking for, just get in touch.',
  items: DEFAULT_ITEMS,
};

const sanitizeStr = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function makeId() {
  return `faq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeCtaType(raw: unknown): FaqCtaType {
  const v = sanitizeStr(raw) as FaqCtaType;
  const allowed: FaqCtaType[] = ['none', 'enquire', 'join', 'contact'];
  return allowed.includes(v) ? v : 'none';
}

function sanitizeItem(raw: unknown, index: number): FaqItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const question = sanitizeStr(r.question);
  const answer = sanitizeStr(r.answer);
  if (!question || !answer) return null;

  const category = sanitizeStr(r.category) || undefined;
  const id = sanitizeStr(r.id) || `${makeId()}_${index}`;

  const ctaType = sanitizeCtaType(r.ctaType);
  const ctaLabelRaw = sanitizeStr(r.ctaLabel);
  const ctaLabel = ctaType === 'none' || !ctaLabelRaw ? undefined : ctaLabelRaw;

  return { id, question, answer, category, ctaType, ctaLabel };
}

function sanitizeConfig(body: Partial<FaqConfig>): FaqConfig {
  const itemsRaw = Array.isArray(body.items) ? body.items : DEFAULT_ITEMS;

  const items: FaqItem[] = itemsRaw
    .map((item, idx) => sanitizeItem(item, idx))
    .filter((i): i is FaqItem => !!i);

  return {
    eyebrow: sanitizeStr(body.eyebrow) || DEFAULT_CONFIG.eyebrow,
    title: sanitizeStr(body.title) || DEFAULT_CONFIG.title,
    lead: sanitizeStr(body.lead) || DEFAULT_CONFIG.lead,
    items: items.length ? items : DEFAULT_ITEMS,
  };
}

export async function GET() {
  try {
    const row = await prisma.faqPage.findUnique({
      where: { key: KEY },
    });

    if (!row) {
      return NextResponse.json(DEFAULT_CONFIG);
    }

    const rawItems = (row.items ?? []) as unknown;
    const itemsArray = Array.isArray(rawItems) ? rawItems : DEFAULT_ITEMS;

    const items: FaqItem[] = itemsArray
      .map((item, idx) => sanitizeItem(item, idx))
      .filter((i): i is FaqItem => !!i);

    const config: FaqConfig = {
      eyebrow: row.eyebrow || DEFAULT_CONFIG.eyebrow,
      title: row.title || DEFAULT_CONFIG.title,
      lead: row.lead || DEFAULT_CONFIG.lead,
      items: items.length ? items : DEFAULT_ITEMS,
    };

    return NextResponse.json(config);
  } catch (e) {
    console.error('GET /api/settings/faq failed:', e);
    return NextResponse.json({ error: 'Server error (GET faq).' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<FaqConfig>;
    const data = sanitizeConfig(body);

    const itemsJson = data.items as unknown as Prisma.JsonArray;

    const saved = await prisma.faqPage.upsert({
      where: { key: KEY },
      create: {
        key: KEY,
        eyebrow: data.eyebrow,
        title: data.title,
        lead: data.lead,
        items: itemsJson,
      },
      update: {
        eyebrow: data.eyebrow,
        title: data.title,
        lead: data.lead,
        items: itemsJson,
      },
    });

    revalidatePath('/faq');
    return NextResponse.json({ ok: true, id: saved.id });
  } catch (e) {
    console.error('POST /api/settings/faq failed:', e);
    return NextResponse.json({ error: 'Server error (POST faq).' }, { status: 500 });
  }
}
