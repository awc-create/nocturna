import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const KEY = 'clients';

type ClientLogo = {
  name: string;
  src: string;
  href?: string;

  blurb?: string;

  quote?: string;
  personName?: string;
  personTitle?: string;

  storyUrl?: string;
  storyLabel?: string;

  backBg?: string;
};

const DEFAULTS = {
  title: 'Our Clients',
  subtitle: 'Trusted by leading venues, bars and creative brands.',
  items: [
    {
      name: "Regina's Bar & Restaurant",
      src: '/assets/clients/garden.png',
      blurb: 'Restaurant & Late-Night Bar, Birmingham',
      quote: '“They keep the room perfectly tuned, from first drink to last call.”',
      personName: 'Gregorio',
      personTitle: 'General Manager',
      storyUrl: '/case-studies/reginas',
      storyLabel: 'Watch the story',
      // backBg: 'linear-gradient(180deg, rgba(2,6,23,.55), rgba(2,6,23,.88))',
    },
    {
      name: 'Luna Lounge',
      src: '/assets/clients/luna.png',
      blurb: 'Cocktail bar & events venue',
      quote: '“Smooth, brand-safe sets that still feel fresh every week.”',
      personName: '—',
      personTitle: 'Brand Director',
    },
    {
      name: 'Stardust',
      src: '/assets/clients/stardust.png',
      blurb: 'Live events & private hire',
      quote: '“Reliable rosters and zero drama with tech or timings.”',
      personName: '—',
      personTitle: 'Events Lead',
    },
    {
      name: 'Stellar',
      src: '/assets/clients/stellar.png',
      blurb: 'Late-night venue',
      quote: '“Guests notice the music — in a good way, not a loud way.”',
      personName: '—',
      personTitle: 'Venue Owner',
    },
    {
      name: 'Symphony Center',
      src: '/assets/clients/symphony.png',
      blurb: 'Culture & programming',
      quote: '“They understand our audience and programme to match.”',
      personName: '—',
      personTitle: 'Programming Manager',
    },
  ] as ClientLogo[],
};

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function parseItems(input: unknown): ClientLogo[] {
  if (!Array.isArray(input)) return DEFAULTS.items;

  const out: ClientLogo[] = [];
  for (const it of input) {
    if (!it || typeof it !== 'object') continue;
    const r = it as Record<string, unknown>;

    const name = s(r.name);
    const src = s(r.src);
    const href = s(r.href);

    if (!name || !src) continue;

    const item: ClientLogo = { name, src };
    if (href) item.href = href;

    const blurb = s(r.blurb);
    const quote = s(r.quote);
    const personName = s(r.personName);
    const personTitle = s(r.personTitle);
    const storyUrl = s(r.storyUrl);
    const storyLabel = s(r.storyLabel);
    const backBg = s(r.backBg);

    if (blurb) item.blurb = blurb;
    if (quote) item.quote = quote;
    if (personName) item.personName = personName;
    if (personTitle) item.personTitle = personTitle;
    if (storyUrl) item.storyUrl = storyUrl;
    if (storyLabel) item.storyLabel = storyLabel;
    if (backBg) item.backBg = backBg;

    out.push(item);
  }

  return out.length ? out.slice(0, 40) : DEFAULTS.items;
}

export async function GET() {
  try {
    const row = await prisma.homeClients.findUnique({ where: { key: KEY } });
    if (!row) {
      return NextResponse.json({
        title: DEFAULTS.title,
        subtitle: DEFAULTS.subtitle,
        lead: DEFAULTS.subtitle, // legacy alias
        items: DEFAULTS.items,
      });
    }

    const subtitle = row.subtitle ?? DEFAULTS.subtitle;

    return NextResponse.json({
      title: row.title ?? DEFAULTS.title,
      subtitle,
      lead: subtitle, // legacy alias
      items: parseItems(row.items as unknown),
    });
  } catch (e) {
    console.error('GET /api/home/clients failed:', e);
    return NextResponse.json({ error: 'Server error (GET clients).' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<{
      title: string;
      subtitle: string;
      lead: string; // accept legacy
      items: unknown;
    }>;

    const itemsArr = parseItems(body.items);

    const data = {
      title: s(body.title) || DEFAULTS.title,
      subtitle: s(body.subtitle) || s(body.lead) || DEFAULTS.subtitle,
      items: itemsArr as unknown as Prisma.JsonArray,
    };

    await prisma.homeClients.upsert({
      where: { key: KEY },
      create: { key: KEY, ...data },
      update: data,
    });

    revalidatePath('/');
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/home/clients failed:', e);
    return NextResponse.json({ error: 'Server error (POST clients).' }, { status: 500 });
  }
}
