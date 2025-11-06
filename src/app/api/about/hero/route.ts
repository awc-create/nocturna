// src/app/api/about/hero/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MediaType as MediaTypeEnum, Prisma } from '@prisma/client';

const DEFAULT = {
  mediaType: MediaTypeEnum.VIDEO,
  imageSrc: '/assets/about-hero.jpg',
  videoSrc: '/assets/about-hero.mp4',
  posterSrc: '', // optional; blank means “auto-poster” in the client
  loopVideoSrc: null, // single-video flow
  loopStartSec: 4,
  loopEndSec: 10,
  startPausedForReturning: true,
  title: 'Alex & Alin — Who We Are',
  description:
    'Nocturna curates DJs and live acts to shape atmosphere-first nights for venues and brands.',
  ctaText: 'WORK WITH US',
  ctaHref: '/apply',
  overlayDarkness: 0.55,
} as const;

const toMediaEnum = (v: unknown) => (v === 'IMAGE' ? MediaTypeEnum.IMAGE : MediaTypeEnum.VIDEO);
const clampNum = (n: unknown, min: number, max: number, fallback: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;

export async function GET() {
  const row = await prisma.heroAbout.findUnique({ where: { key: 'about' } });
  if (!row) {
    const created = await prisma.heroAbout.create({ data: { key: 'about', ...DEFAULT } });
    return NextResponse.json(created);
  }
  return NextResponse.json(row);
}

export async function POST(req: Request) {
  const b = await req.json();

  const loopStart = clampNum(b.loopStartSec, 0, 3600, DEFAULT.loopStartSec);
  const loopEnd = clampNum(b.loopEndSec, 0, 3600, DEFAULT.loopEndSec);

  const data: Omit<Prisma.HeroAboutCreateInput, 'key'> = {
    mediaType: toMediaEnum(b.mediaType),
    imageSrc: b.imageSrc ?? DEFAULT.imageSrc,
    videoSrc: b.videoSrc?.trim() ? b.videoSrc : null,
    posterSrc: b.posterSrc?.trim() ? b.posterSrc : null,
    loopVideoSrc: null, // enforce one-video flow
    loopStartSec: loopStart,
    loopEndSec: Math.max(loopStart + 0.25, loopEnd),
    startPausedForReturning:
      typeof b.startPausedForReturning === 'boolean'
        ? b.startPausedForReturning
        : DEFAULT.startPausedForReturning,
    title: b.title ?? DEFAULT.title,
    description: b.description ?? DEFAULT.description,
    ctaText: b.ctaText ?? DEFAULT.ctaText,
    ctaHref: b.ctaHref ?? DEFAULT.ctaHref,
    overlayDarkness: clampNum(b.overlayDarkness, 0, 1, DEFAULT.overlayDarkness),
  };

  const updated = await prisma.heroAbout.upsert({
    where: { key: 'about' },
    update: data,
    create: { key: 'about', ...data },
  });

  return NextResponse.json(updated);
}
