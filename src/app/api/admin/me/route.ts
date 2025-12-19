import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';

function requireAdmin(session: Session | null) {
  const email = session?.user?.email?.toLowerCase?.() ?? null;
  const role = session?.user?.role ?? 'user';

  if (!email) return { ok: false as const, status: 401 as const, email: null };
  if (role !== 'admin') return { ok: false as const, status: 403 as const, email };
  return { ok: true as const, status: 200 as const, email };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const gate = requireAdmin(session);

  if (!gate.ok) {
    return new NextResponse(gate.status === 401 ? 'Unauthorized' : 'Forbidden', {
      status: gate.status,
    });
  }

  const user = await prisma.user.findUnique({
    where: { email: gate.email },
    select: { email: true, name: true, image: true, role: true },
  });

  if (!user) return new NextResponse('Not found', { status: 404 });

  return NextResponse.json({
    email: user.email,
    name: user.name ?? 'Alex',
    image: user.image ?? null,
    role: user.role === 'admin' ? 'admin' : 'user',
  });
}

type PostBody =
  | { action: 'profile'; name?: string; image?: string | null }
  | { action: 'password'; currentPassword: string; newPassword: string };

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const gate = requireAdmin(session);

  if (!gate.ok) {
    return new NextResponse(gate.status === 401 ? 'Unauthorized' : 'Forbidden', {
      status: gate.status,
    });
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return new NextResponse('Invalid JSON', { status: 400 });
  }

  if (body.action === 'profile') {
    const nextName = typeof body.name === 'string' ? body.name.trim() : undefined;

    // allow: null (clear), string (set), undefined (ignore)
    const nextImage =
      body.image === null || typeof body.image === 'string' ? body.image : undefined;

    const updated = await prisma.user.update({
      where: { email: gate.email },
      data: {
        ...(nextName !== undefined ? { name: nextName } : {}),
        ...(nextImage !== undefined ? { image: nextImage } : {}),
      },
      select: { email: true, name: true, image: true, role: true },
    });

    return NextResponse.json({
      email: updated.email,
      name: updated.name ?? 'Alex',
      image: updated.image ?? null,
      role: updated.role === 'admin' ? 'admin' : 'user',
    });
  }

  if (body.action === 'password') {
    const currentPassword = body.currentPassword?.trim();
    const newPassword = body.newPassword?.trim();

    if (!currentPassword || !newPassword) {
      return new NextResponse('Missing password fields', { status: 400 });
    }
    if (newPassword.length < 8) {
      return new NextResponse('New password must be at least 8 characters', {
        status: 400,
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: gate.email },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return new NextResponse('No password set for this account', { status: 400 });
    }

    const ok = await compare(currentPassword, user.passwordHash);
    if (!ok) return new NextResponse('Current password is incorrect', { status: 400 });

    const nextHash = await hash(newPassword, 12);

    await prisma.user.update({
      where: { email: gate.email },
      data: { passwordHash: nextHash },
    });

    return NextResponse.json({ ok: true });
  }

  return new NextResponse('Invalid action', { status: 400 });
}
