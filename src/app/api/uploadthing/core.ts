// src/app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from 'uploadthing/server';
import { prisma } from '@/lib/prisma';
import type { UploadedFileData } from 'uploadthing/types';

const f = createUploadthing();

export type UploadedMedia = {
  name: string;
  url: string;
  size: number;
  type: string; // mime type
};

type UTFile = UploadedFileData;

const isImage = (mime?: string) => !!mime && mime.startsWith('image/');
const isVideo = (mime?: string) => !!mime && mime.startsWith('video/');

async function storeMedia(file: UTFile) {
  const url = file.ufsUrl ?? file.url;
  const size = typeof file.size === 'number' ? file.size : Number(file.size) || 0;

  const normalised: UploadedMedia = {
    name: file.name ?? 'untitled',
    url,
    size,
    type: file.type ?? 'unknown',
  };

  try {
    // Avoid exact duplicates
    const existing = await prisma.media.findFirst({ where: { url } });
    if (existing) {
      return { file: normalised, skipped: true as const };
    }

    const created = await prisma.media.create({
      data: normalised,
    });

    // Optional: keep only latest by name
    await prisma.media.deleteMany({
      where: { name: created.name, NOT: { id: created.id } },
    });

    return { file: normalised, skipped: false as const };
  } catch (err) {
    console.error('❌ UploadThing DB error:', err);
    // Still return file meta so client can use URL
    return { file: normalised, skipped: false as const };
  }
}

/**
 * Split endpoints so image fields cannot accept videos.
 */
export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: '16MB' } }).onUploadComplete(async ({ file }) => {
    if (!isImage(file.type)) {
      throw new Error('Invalid file type. Please upload an IMAGE (png/jpg/webp).');
    }
    return storeMedia(file);
  }),

  videoUploader: f({ video: { maxFileSize: '128MB' } }).onUploadComplete(async ({ file }) => {
    if (!isVideo(file.type)) {
      throw new Error('Invalid file type. Please upload a VIDEO (mp4/webm/mov).');
    }
    return storeMedia(file);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
