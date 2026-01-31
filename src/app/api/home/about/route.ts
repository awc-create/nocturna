// src/app/api/home/about/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const KEY = 'about';

type QuickFact = { value: string; label: string };
type ValueCard = { title: string; body: string };

type AboutPayload = {
  eyebrow: string;
  title: string;
  lead: string;
  bullets: string[];
  ctaPrimaryText: string;
  ctaPrimaryHref: string;
  ctaGhostText: string;
  ctaGhostHref: string;
  quickFacts: QuickFact[];
  values: ValueCard[];
  videoUrl?: string | null;
  videoPoster?: string | null;
  videoCaption?: string | null;
};

const DEFAULTS: AboutPayload = {
  eyebrow: 'ABOUT Essentia',
  title: 'Bringing nightlife to life.',
  lead: 'We’re a curated collective of DJs and musicians crafting atmosphere-first experiences for venues and events. From soulful acoustics to floor-filling sets, Essentia delivers sound that fits the room — and the brand.',
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
  ],
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
      body: 'Transparent pricing, tidy invoicing, and dedicated point of contact from enquiry to encore.',
    },
    {
      title: 'Brand-fit sound',
      body: 'Programming that respects brand tone and guest profile at every touchpoint.',
    },
    {
      title: 'Reliable rosters',
      body: 'Depth of talent to cover multi-site schedules and last-minute changes.',
    },
    {
      title: 'Tech-ready',
      body: 'Clear specs, tidy setups, and no drama with in-house teams or residents.',
    },
    {
      title: 'Guest-first',
      body: 'Read-the-room sets that build energy without overwhelming the space.',
    },
    {
      title: 'Feedback loops',
      body: 'We learn every week to refine the policy and roster for your venue.',
    },
  ],
  videoUrl: null,
  videoPoster: null,
  videoCaption: null,
};

const sanitize = (x: unknown) => (typeof x === 'string' ? x.trim() : '');

function parseFacts(input: unknown): QuickFact[] {
  if (!Array.isArray(input)) return DEFAULTS.quickFacts;
  return input
    .map((raw): QuickFact | null => {
      if (typeof raw !== 'object' || raw === null) return null;
      const r = raw as Record<string, unknown>;
      const value = sanitize(r.value);
      const label = sanitize(r.label);
      return value && label ? { value, label } : null;
    })
    .filter((x): x is QuickFact => !!x);
}

function parseValues(input: unknown): ValueCard[] {
  if (!Array.isArray(input)) return DEFAULTS.values;
  return input
    .map((raw): ValueCard | null => {
      if (typeof raw !== 'object' || raw === null) return null;
      const r = raw as Record<string, unknown>;
      const title = sanitize(r.title);
      const body = sanitize(r.body);
      return title && body ? { title, body } : null;
    })
    .filter((x): x is ValueCard => !!x);
}

export async function GET() {
  try {
    const row = await prisma.homeAbout.findUnique({ where: { key: KEY } });
    if (!row) return NextResponse.json(DEFAULTS);

    const facts = parseFacts(row.quickFacts as unknown);
    const values = parseValues(row.values as unknown);

    return NextResponse.json({
      eyebrow: row.eyebrow ?? DEFAULTS.eyebrow,
      title: row.title ?? DEFAULTS.title,
      lead: row.lead ?? DEFAULTS.lead,
      bullets: row.bullets?.length ? row.bullets : DEFAULTS.bullets,
      ctaPrimaryText: row.ctaPrimaryText ?? DEFAULTS.ctaPrimaryText,
      ctaPrimaryHref: row.ctaPrimaryHref ?? DEFAULTS.ctaPrimaryHref,
      ctaGhostText: row.ctaGhostText ?? DEFAULTS.ctaGhostText,
      ctaGhostHref: row.ctaGhostHref ?? DEFAULTS.ctaGhostHref,
      quickFacts: facts.length ? facts : DEFAULTS.quickFacts,
      values: values.length ? values : DEFAULTS.values,
      videoUrl: row.videoUrl ?? null,
      videoPoster: row.videoPoster ?? null,
      videoCaption: row.videoCaption ?? null,
    } satisfies AboutPayload);
  } catch (e: unknown) {
    console.error('GET /api/home/about failed:', e);
    return NextResponse.json({ error: 'Server error (GET about).' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AboutPayload>;

    const prev = await prisma.homeAbout.findUnique({ where: { key: KEY } });

    const incomingVideoUrl = sanitize(body.videoUrl);
    const incomingPoster = sanitize(body.videoPoster);
    const incomingCaption = sanitize(body.videoCaption);

    const data = {
      eyebrow: sanitize(body.eyebrow) || DEFAULTS.eyebrow,
      title: sanitize(body.title) || DEFAULTS.title,
      lead: sanitize(body.lead) || DEFAULTS.lead,
      bullets: Array.isArray(body.bullets) && body.bullets.length ? body.bullets : DEFAULTS.bullets,
      ctaPrimaryText: sanitize(body.ctaPrimaryText) || DEFAULTS.ctaPrimaryText,
      ctaPrimaryHref: sanitize(body.ctaPrimaryHref) || DEFAULTS.ctaPrimaryHref,
      ctaGhostText: sanitize(body.ctaGhostText) || DEFAULTS.ctaGhostText,
      ctaGhostHref: sanitize(body.ctaGhostHref) || DEFAULTS.ctaGhostHref,
      quickFacts: parseFacts(body.quickFacts),
      values: parseValues(body.values),
      videoUrl: incomingVideoUrl || null,
      videoPoster: incomingPoster || null,
      videoCaption: incomingCaption || null,
    };

    const saved = await prisma.homeAbout.upsert({
      where: { key: KEY },
      create: { key: KEY, ...data },
      update: data,
    });

    // Clean up old Media if URLs changed
    const urlsToDelete: string[] = [];
    if (prev?.videoUrl && prev.videoUrl !== saved.videoUrl) urlsToDelete.push(prev.videoUrl);
    if (prev?.videoPoster && prev.videoPoster !== saved.videoPoster)
      urlsToDelete.push(prev.videoPoster);

    if (urlsToDelete.length) {
      await prisma.media.deleteMany({
        where: { url: { in: urlsToDelete } },
      });
    }

    revalidatePath('/');
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error('POST /api/home/about failed:', e);
    return NextResponse.json({ error: 'Server error (POST about).' }, { status: 500 });
  }
}
