import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse('Unauthorized', { status: 401 });
  if (session.user.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

  const body = (await req.json()) as { currentPassword?: string; newPassword?: string };

  const currentPassword = body.currentPassword ?? '';
  const newPassword = body.newPassword ?? '';

  if (newPassword.length < 8) return new NextResponse('Password too short', { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) return new NextResponse('No password set', { status: 400 });

  const ok = await compare(currentPassword, user.passwordHash);
  if (!ok) return new NextResponse('Current password is incorrect', { status: 400 });

  const passwordHash = await hash(newPassword, 12);

  await prisma.user.update({
    where: { email: session.user.email.toLowerCase() },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
