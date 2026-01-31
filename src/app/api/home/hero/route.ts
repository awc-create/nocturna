import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { MediaType } from '@prisma/client'; // ✅ use the Prisma enum

const KEY = 'home';

const DEFAULTS = {
  key: KEY,
  mediaType: MediaType.IMAGE as MediaType, // ✅ enum, not string
  imageSrc: '', // no media picked yet
  videoSrc: null as string | null,
  posterSrc: null as string | null,
  title: 'Bringing nightlife to life.',
  description:
    'We’re a curated collective of DJs and musicians crafting atmosphere-first experiences for venues and events. From soulful acoustics to floor-filling sets, Essentia delivers sound that fits the room — and the brand.',
  ctaText: 'ENQUIRE NOW',
  ctaHref: '#enquire', // ⬅ scroll to enquire section on home
  overlayDarkness: 0.5,
};

export async function GET() {
  const hero = await prisma.heroHome.findUnique({ where: { key: KEY } });
  // Prisma will serialize enums to strings in JSON automatically
  return NextResponse.json(hero ? { ...DEFAULTS, ...hero } : DEFAULTS);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<{
      mediaType: 'VIDEO' | 'IMAGE';
      imageSrc: string;
      videoSrc?: string | null;
      posterSrc?: string | null;
      title: string;
      description: string;
      ctaText: string;
      ctaHref: string;
      overlayDarkness: number;
    }>;

    const overlayDarkness =
      typeof body.overlayDarkness === 'number'
        ? Math.max(0, Math.min(1, body.overlayDarkness))
        : DEFAULTS.overlayDarkness;

    // ✅ Map string -> Prisma enum; keep optional fields nullable/undefined
    const data = {
      mediaType: body.mediaType === 'VIDEO' ? MediaType.VIDEO : MediaType.IMAGE,
      imageSrc: body.imageSrc ?? DEFAULTS.imageSrc,
      videoSrc: body.videoSrc ?? null,
      posterSrc: body.posterSrc ?? null,
      title: body.title ?? DEFAULTS.title,
      description: body.description ?? DEFAULTS.description,
      ctaText: body.ctaText ?? DEFAULTS.ctaText,
      ctaHref: body.ctaHref ?? DEFAULTS.ctaHref,
      overlayDarkness,
    };

    const hero = await prisma.heroHome.upsert({
      where: { key: KEY },
      create: { key: KEY, ...data },
      update: data,
    });

    revalidatePath('/'); // show changes immediately on Home
    return NextResponse.json(hero);
  } catch (err) {
    console.error('POST /api/home/hero failed:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
