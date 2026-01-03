import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const KEY = 'services';

export interface ServiceItem {
  key: string;
  title: string;
  blurb: string;
  href: string;
  image: string;
  tag: string;
  backImage?: string;
  detail?: string;
  includes?: string[];
}

const DEFAULTS = {
  kicker: 'Our Services',
  title: 'Sound that fits the room.',
  lead: 'Two core offerings to start — built to scale with your brand.',
  items: [
    {
      key: 'dj',
      title: 'DJs',
      blurb:
        'Signature selectors for restaurants, bars and late-night venues. Floor-filling sets matched to brand, guest profile, and time of day.',
      href: '#enquire',
      image: '/assets/services/djs.jpg',
      backImage: '/assets/services/djs-back.jpg',
      tag: 'Nightlife energy',
      detail:
        'Our DJ roster includes experienced selectors used to brand-fit programming, guest-flow control and multi-room setups.',
      includes: [
        'Programming aligned to time of day and atmosphere',
        'DJs briefed on volume, tone, and venue context',
        'Clear communication and artist alignment',
        'One point of contact throughout',
        'Reliable cover if availability changes',
      ],
    },
    {
      key: 'musician',
      title: 'Musicians',
      blurb:
        'Acoustic duos, sax, strings, vocalists — atmosphere-first performances curated for intimate dining and premium hospitality.',
      href: '#enquire',
      image: '/assets/services/musicians.jpg',
      backImage: '/assets/services/musicians-back.jpg',
      tag: 'Live atmosphere',
      detail:
        'We supply adaptable musicians for brunch, dinner or lounges — artists who enhance the atmosphere without overwhelming the room.',
      includes: [
        'Set formats matched to service style and energy',
        'Musicians briefed on volume, tone, and venue context',
        'Clear communication and artist alignment',
        'One point of contact throughout',
        'Reliable cover if availability changes',
      ],
    },
  ] as ServiceItem[],
};

const s = (x: unknown) => (typeof x === 'string' ? x.trim() : '');

function parseIncludes(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const out = input
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
    .slice(0, 12);
  return out.length ? out : [];
}

function parseItems(input: unknown): ServiceItem[] {
  if (!Array.isArray(input)) return DEFAULTS.items;

  const cleaned: ServiceItem[] = [];

  for (const raw of input) {
    if (typeof raw !== 'object' || raw === null) continue;
    const r = raw as Record<string, unknown>;

    const title = s(r.title);
    const blurb = s(r.blurb);
    if (!title || !blurb) continue;

    const key = s(r.key) || title.toLowerCase().replace(/\s+/g, '-');

    const item: ServiceItem = {
      key,
      title,
      blurb,
      href: s(r.href) || '#enquire',
      image: s(r.image),
      tag: s(r.tag),
    };

    const backImage = s(r.backImage);
    if (backImage) item.backImage = backImage;

    const detail = s(r.detail);
    if (detail) item.detail = detail;

    const includes = parseIncludes(r.includes);
    if (includes) item.includes = includes;

    cleaned.push(item);
    if (cleaned.length >= 12) break;
  }

  return cleaned.length ? cleaned : DEFAULTS.items;
}

export async function GET() {
  try {
    const row = await prisma.homeServices.findUnique({ where: { key: KEY } });
    if (!row) return NextResponse.json(DEFAULTS);

    return NextResponse.json({
      kicker: row.kicker ?? DEFAULTS.kicker,
      title: row.title ?? DEFAULTS.title,
      lead: row.lead ?? DEFAULTS.lead,
      items: parseItems(row.items as unknown),
    });
  } catch (e) {
    console.error('GET /api/home/services failed:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const items = parseItems(body.items);

    const data = {
      kicker: s(body.kicker) || DEFAULTS.kicker,
      title: s(body.title) || DEFAULTS.title,
      lead: s(body.lead) || DEFAULTS.lead,
      items: items as unknown as Prisma.JsonArray,
    };

    await prisma.homeServices.upsert({
      where: { key: KEY },
      create: { key: KEY, ...data },
      update: data,
    });

    revalidatePath('/');
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/home/services failed:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
