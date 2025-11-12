// src/app/api/home/about/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const KEY = 'about';

type QuickFact = { value: string; label: string };
type ValueCard = { title: string; body: string };

const DEFAULTS = {
  eyebrow: 'ABOUT NOCTURNA',
  title: 'Bringing nightlife to life.',
  lead: 'We’re a curated collective of DJs and musicians crafting atmosphere-first experiences for venues and events. From soulful acoustics to floor-filling sets, Nocturna delivers sound that fits the room — and the brand.',
  blurb:
    'A curated collective of DJs and musicians crafting atmosphere-first experiences — from soulful acoustics to floor-filling sets. We deliver sound that fits the room, the guests, and the brand.',
  bullets: [
    'Curation over chaos — the right artist for the right room.',
    'Reliable bookings, clear comms, zero hidden costs.',
    'Artist-first ethos; venue-ready professionalism.',
  ],
  ctaPrimaryText: 'Learn more',
  ctaPrimaryHref: '/about',
  ctaGhostText: 'Enquire now',
  ctaGhostHref: '/enquire',
  quickFacts: [
    { value: '200+', label: 'Gigs curated' },
    { value: 'UK-wide', label: 'Venue coverage' },
    { value: 'DJs & Musicians', label: 'Tailored rosters' },
  ] as QuickFact[],
  videoUrl: '' as string,
  videoPoster: '' as string,
  videoCaption: '' as string,
  values: [
    {
      title: 'Curation over chaos',
      body: 'Every brief matched to the right artist, not the nearest calendar gap.',
    },
    {
      title: 'Artist-first',
      body: 'Fair fees, clear comms, reliable logistics — because great work needs great conditions.',
    },
    {
      title: 'Venue-ready',
      body: 'Professionalism on arrival, compact setups, and volume discipline for premium hospitality.',
    },
    {
      title: 'Zero surprises',
      body: 'Transparent pricing, tidy invoicing, and a single point of contact.',
    },
  ] as ValueCard[],
};

const s = (x: unknown) => (typeof x === 'string' ? x.trim() : '');

function parseStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean);
}

function parseFacts(input: unknown): QuickFact[] {
  if (!Array.isArray(input)) return DEFAULTS.quickFacts;
  const out: QuickFact[] = [];
  for (const item of input) {
    if (typeof item === 'object' && item !== null) {
      const rec = item as Record<string, unknown>;
      const value = s(rec.value);
      const label = s(rec.label);
      if (value && label) out.push({ value, label });
    }
  }
  return out.length ? out : DEFAULTS.quickFacts;
}

function parseValues(input: unknown): ValueCard[] {
  if (!Array.isArray(input)) return DEFAULTS.values;
  const out: ValueCard[] = [];
  for (const item of input) {
    if (typeof item === 'object' && item !== null) {
      const rec = item as Record<string, unknown>;
      const title = s(rec.title);
      const body = s(rec.body);
      if (title && body) out.push({ title, body });
    }
  }
  return out.length ? out : DEFAULTS.values;
}

/** Safely get a possibly-nonexistent string column from a Prisma row. */
function getRowString(row: unknown, key: string): string {
  if (typeof row === 'object' && row !== null) {
    const rec = row as Record<string, unknown>;
    return s(rec[key]);
  }
  return '';
}

/** Safely get a JSON field (Prisma.JsonValue) from a Prisma row. */
function getRowJson(row: unknown, key: string): Prisma.JsonValue | null {
  if (typeof row === 'object' && row !== null) {
    const rec = row as Record<string, unknown>;
    const val = rec[key] as unknown;
    // Allow arrays/objects/strings/numbers/bools/null (valid JsonValue)
    if (
      val === null ||
      typeof val === 'string' ||
      typeof val === 'number' ||
      typeof val === 'boolean' ||
      Array.isArray(val) ||
      (typeof val === 'object' && val !== null)
    ) {
      return val as Prisma.JsonValue;
    }
  }
  return null;
}

export async function GET() {
  try {
    const row = await prisma.homeAbout.findUnique({ where: { key: KEY } });
    if (!row) return NextResponse.json(DEFAULTS);

    // Existing columns
    const eyebrow = row.eyebrow ?? DEFAULTS.eyebrow;
    const title = row.title ?? DEFAULTS.title;
    const lead = row.lead ?? DEFAULTS.lead;
    const bullets = row.bullets?.length ? row.bullets : DEFAULTS.bullets;
    const ctaPrimaryText = row.ctaPrimaryText ?? DEFAULTS.ctaPrimaryText;
    const ctaPrimaryHref = row.ctaPrimaryHref ?? DEFAULTS.ctaPrimaryHref;
    const ctaGhostText = row.ctaGhostText ?? DEFAULTS.ctaGhostText;
    const ctaGhostHref = row.ctaGhostHref ?? DEFAULTS.ctaGhostHref;

    // JSON fields (present in older schema too)
    const quickFacts = parseFacts(getRowJson(row, 'quickFacts') ?? []);

    // New optional columns (safe even if not yet in generated types)
    const blurb = getRowString(row, 'blurb') || lead || DEFAULTS.blurb;
    const videoUrl = getRowString(row, 'videoUrl');
    const videoPoster = getRowString(row, 'videoPoster');
    const videoCaption = getRowString(row, 'videoCaption');
    const values = parseValues(getRowJson(row, 'values') ?? []);

    return NextResponse.json({
      eyebrow,
      title,
      lead,
      blurb,
      bullets,
      ctaPrimaryText,
      ctaPrimaryHref,
      ctaGhostText,
      ctaGhostHref,
      quickFacts,
      videoUrl,
      videoPoster,
      videoCaption,
      values,
    });
  } catch (e) {
    console.error('GET /api/home/about failed:', e);
    return NextResponse.json({ error: 'Server error (GET about).' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<typeof DEFAULTS> & {
      quickFacts?: unknown;
      values?: unknown;
      bullets?: unknown;
    };

    const data = {
      eyebrow: s(body.eyebrow) || DEFAULTS.eyebrow,
      title: s(body.title) || DEFAULTS.title,
      lead: s(body.lead) || DEFAULTS.lead,
      blurb: s(body.blurb) || s(body.lead) || DEFAULTS.blurb,
      bullets: parseStringArray(body.bullets).length
        ? parseStringArray(body.bullets)
        : DEFAULTS.bullets,
      ctaPrimaryText: s(body.ctaPrimaryText) || DEFAULTS.ctaPrimaryText,
      ctaPrimaryHref: s(body.ctaPrimaryHref) || DEFAULTS.ctaPrimaryHref,
      ctaGhostText: s(body.ctaGhostText) || DEFAULTS.ctaGhostText,
      ctaGhostHref: s(body.ctaGhostHref) || DEFAULTS.ctaGhostHref,
      quickFacts: parseFacts(body.quickFacts),
      videoUrl: s(body.videoUrl),
      videoPoster: s(body.videoPoster),
      videoCaption: s(body.videoCaption),
      values: parseValues(body.values),
    };

    await prisma.homeAbout.upsert({
      where: { key: KEY },
      create: { key: KEY, ...data },
      update: data,
    });

    revalidatePath('/');
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/home/about failed:', e);
    return NextResponse.json({ error: 'Server error (POST about).' }, { status: 500 });
  }
}
