import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const KEY = 'about';

type QuickFact = { value: string; label: string };

const DEFAULTS = {
  eyebrow: 'ABOUT NOCTURNA',
  title: 'Bringing nightlife to life.',
  lead: 'We’re a curated collective of DJs and musicians crafting atmosphere-first experiences for venues and events. From soulful acoustics to floor-filling sets, Nocturna delivers sound that fits the room — and the brand.',
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
};

const sanitize = (x: unknown) => (typeof x === 'string' ? x.trim() : '');

function parseFacts(input: unknown): QuickFact[] {
  if (!Array.isArray(input)) return DEFAULTS.quickFacts;
  return input
    .map((raw) => {
      if (typeof raw !== 'object' || raw === null) return null;
      const r = raw as Record<string, unknown>;
      const value = sanitize(r.value);
      const label = sanitize(r.label);
      return value && label ? ({ value, label } as QuickFact) : null;
    })
    .filter(Boolean) as QuickFact[];
}

export async function GET() {
  try {
    const row = await prisma.homeAbout.findUnique({ where: { key: KEY } });
    if (!row) return NextResponse.json(DEFAULTS);

    const facts = parseFacts(row.quickFacts as unknown);

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
    });
  } catch (e) {
    console.error('GET /api/home/about failed:', e);
    return NextResponse.json({ error: 'Server error (GET about).' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<typeof DEFAULTS> & { quickFacts?: unknown };

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
