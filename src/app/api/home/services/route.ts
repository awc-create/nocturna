// src/app/api/home/services/route.ts
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
    },
  ] as ServiceItem[],
};

const sanitize = (x: unknown) => (typeof x === 'string' ? x.trim() : '');

function parseItems(input: unknown): ServiceItem[] {
  if (!Array.isArray(input)) return DEFAULTS.items;

  const cleaned = input
    .map((raw) => {
      if (typeof raw !== 'object' || raw === null) return null;

      const r = raw as Record<string, unknown>;

      const title = sanitize(r.title);
      const blurb = sanitize(r.blurb);
      if (!title || !blurb) return null;

      return {
        key: sanitize(r.key) || title.toLowerCase().replace(/\s+/g, '-'),
        title,
        blurb,
        href: sanitize(r.href) || '#enquire',
        image: sanitize(r.image),
        tag: sanitize(r.tag),
        backImage: sanitize(r.backImage),
        detail: sanitize(r.detail),
      } as ServiceItem;
    })
    .filter((i): i is ServiceItem => !!i)
    .slice(0, 12);

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
    const body = await req.json();
    const items = parseItems(body.items);
    const data = {
      kicker: sanitize(body.kicker) || DEFAULTS.kicker,
      title: sanitize(body.title) || DEFAULTS.title,
      lead: sanitize(body.lead) || DEFAULTS.lead,
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
