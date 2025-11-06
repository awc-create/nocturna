import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 12)));
  const rows = await prisma.media.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return NextResponse.json(rows);
}
