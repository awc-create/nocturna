import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const KEY = 'clients';

type ClientLogo = { name: string; src: string; href?: string };

const DEFAULTS = {
  title: 'Our Clients',
  lead: 'Trusted by leading venues, bars and creative brands.',
  items: [
    { name: 'Garden', src: '/assets/clients/garden.png' },
    { name: 'Luna', src: '/assets/clients/luna.png' },
    { name: 'Stardust', src: '/assets/clients/stardust.png' },
    { name: 'Stellar', src: '/assets/clients/stellar.png' },
    { name: 'Symphony', src: '/assets/clients/symphony.png' },
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
    if (name && src) out.push(href ? { name, src, href } : { name, src });
  }
  return out.length ? out.slice(0, 40) : DEFAULTS.items;
}

export async function GET() {
  try {
    const row = await prisma.homeClients.findUnique({ where: { key: KEY } });
    if (!row) return NextResponse.json(DEFAULTS);

    return NextResponse.json({
      title: row.title ?? DEFAULTS.title,
      // 👇 map DB `subtitle` → API `lead`
      lead: row.subtitle ?? DEFAULTS.lead,
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
      lead: string; // UI sends `lead`
      subtitle: string; // allow either, we’ll normalize to subtitle
      items: unknown;
    }>;

    const itemsArr = parseItems(body.items);
    const data = {
      title: s(body.title) || DEFAULTS.title,
      // 👇 normalize: prefer `lead`, fallback to `subtitle`, store in DB as `subtitle`
      subtitle: s(body.lead) || s(body.subtitle) || DEFAULTS.lead,
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
