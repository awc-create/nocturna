// src/app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from 'uploadthing/server';
import { prisma } from '@/lib/prisma';

const f = createUploadthing();

/** Normalised shape we store in DB and return to clients */
export type UploadedMedia = {
  name: string;
  url: string;
  size: number;
  type: string;
};

/**
 * Single UploadThing router for both images + videos.
 * Exported as `ourFileRouter` + type `OurFileRouter`.
 */
export const ourFileRouter = {
  mediaUploader: f({
    image: { maxFileSize: '16MB' }, // posters / images
    video: { maxFileSize: '128MB' }, // hero/about videos
  }).onUploadComplete(async ({ file }) => {
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
        console.warn('⚠️ File already exists in DB:', url);
        return { file: normalised, skipped: true as const };
      }

      const created = await prisma.media.create({
        data: normalised,
      });

      // Optional: keep only latest by name
      await prisma.media.deleteMany({
        where: { name: created.name, NOT: { id: created.id } },
      });

      console.log('[UPLOAD SUCCESS] Stored media + cleaned duplicates');
      return { file: normalised, skipped: false as const };
    } catch (err) {
      console.error('❌ UploadThing DB error:', err);
      // Still return the file meta so the client can at least use the URL
      return { file: normalised, skipped: false as const };
    }
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
