// src/app/api/home/contact/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const KEY = 'contact';

type ContactConfig = {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  recipientEmail?: string | null;
};

const DEFAULT_CONFIG: ContactConfig = {
  title: 'Send us a message.',
  description: 'We’ll get back to you shortly.',
  submitLabel: 'Send Message',
  successMessage: 'Thanks — we’ll be in touch soon.',
  recipientEmail: null,
};

const sanitizeStr = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

function sanitizeConfig(body: Partial<ContactConfig>): ContactConfig {
  return {
    title: sanitizeStr(body.title) || DEFAULT_CONFIG.title,
    description: sanitizeStr(body.description) || DEFAULT_CONFIG.description,
    submitLabel: sanitizeStr(body.submitLabel) || DEFAULT_CONFIG.submitLabel,
    successMessage: sanitizeStr(body.successMessage) || DEFAULT_CONFIG.successMessage,
    recipientEmail: sanitizeStr(body.recipientEmail) || null,
  };
}

export async function GET() {
  try {
    const row = await prisma.homeContact.findUnique({
      where: { key: KEY },
    });

    if (!row) {
      return NextResponse.json(DEFAULT_CONFIG);
    }

    const config: ContactConfig = {
      title: row.title || DEFAULT_CONFIG.title,
      description: row.description || DEFAULT_CONFIG.description,
      submitLabel: row.submitLabel || DEFAULT_CONFIG.submitLabel,
      successMessage: row.successMessage || DEFAULT_CONFIG.successMessage,
      recipientEmail: row.recipientEmail ?? null,
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('GET /api/home/contact failed:', error);
    return NextResponse.json({ error: 'Server error (GET contact).' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ContactConfig>;
    const data = sanitizeConfig(body);

    const saved = await prisma.homeContact.upsert({
      where: { key: KEY },
      create: {
        key: KEY,
        title: data.title,
        description: data.description,
        submitLabel: data.submitLabel,
        successMessage: data.successMessage,
        recipientEmail: data.recipientEmail,
      },
      update: {
        title: data.title,
        description: data.description,
        submitLabel: data.submitLabel,
        successMessage: data.successMessage,
        recipientEmail: data.recipientEmail,
      },
    });

    // Revalidate home + contact page (if you ever add one)
    revalidatePath('/');
    revalidatePath('/contact');

    return NextResponse.json({ ok: true, id: saved.id });
  } catch (error) {
    console.error('POST /api/home/contact failed:', error);
    return NextResponse.json({ error: 'Server error (POST contact).' }, { status: 500 });
  }
}
