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
}

interface ServicesPayload {
  kicker?: string;
  title?: string;
  lead?: string;
  items?: unknown;
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
      href: '/services/djs',
      image: '/assets/services/djs.jpg',
      tag: 'Nightlife energy',
    },
    {
      key: 'musician',
      title: 'Musicians',
      blurb:
        'Acoustic duos, sax, strings, vocalists — atmosphere-first performances curated for intimate dining and premium hospitality.',
      href: '/services/musicians',
      image: '/assets/services/musicians.jpg',
      tag: 'Live atmosphere',
    },
  ] as ServiceItem[],
};

const sanitize = (x: unknown) => (typeof x === 'string' ? x.trim() : '');

function parseItems(input: unknown): ServiceItem[] {
  if (!Array.isArray(input)) return DEFAULTS.items;
  const cleaned: ServiceItem[] = input
    .map((raw): ServiceItem | null => {
      if (typeof raw !== 'object' || raw === null) return null;
      const r = raw as Record<string, unknown>;
      const title = sanitize(r.title);
      const blurb = sanitize(r.blurb);
      const href = sanitize(r.href);
      const image = sanitize(r.image);
      const tag = sanitize(r.tag);
      const key = sanitize(r.key) || title.toLowerCase().replace(/\s+/g, '-');
      return { key, title, blurb, href, image, tag };
    })
    .filter((v): v is ServiceItem => !!v)
    .slice(0, 12);
  return cleaned.length ? cleaned : DEFAULTS.items;
}

export async function GET() {
  try {
    const row = await prisma.homeServices.findUnique({ where: { key: KEY } });
    if (!row) return NextResponse.json(DEFAULTS);

    const items = parseItems(row.items as unknown);
    return NextResponse.json({
      kicker: row.kicker ?? DEFAULTS.kicker,
      title: row.title ?? DEFAULTS.title,
      lead: row.lead ?? DEFAULTS.lead,
      items,
    });
  } catch (e) {
    console.error('GET /api/home/services failed:', e);
    return NextResponse.json({ error: 'Server error (GET services).' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: ServicesPayload = await req.json();

    const itemsArray = parseItems(body.items);
    const itemsJson: Prisma.JsonArray = itemsArray as unknown as Prisma.JsonArray;

    const data = {
      kicker: sanitize(body.kicker) || DEFAULTS.kicker,
      title: sanitize(body.title) || DEFAULTS.title,
      lead: sanitize(body.lead) || DEFAULTS.lead,
      items: itemsJson,
    };

    if (itemsArray.length === 0) {
      return NextResponse.json(
        { error: 'At least one service card is required.' },
        { status: 400 }
      );
    }

    await prisma.homeServices.upsert({
      where: { key: KEY },
      create: { key: KEY, ...data },
      update: data,
    });

    revalidatePath('/');
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/home/services failed:', e);
    return NextResponse.json({ error: 'Server error (POST services).' }, { status: 500 });
  }
}
