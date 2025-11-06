import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { prisma } from '@/lib/prisma';

const f = createUploadthing();

export const ourFileRouter = {
  mediaUploader: f({
    video: { maxFileSize: '128MB' },
    image: { maxFileSize: '16MB' },
  }).onUploadComplete(async ({ file }) => {
    // v9: prefer ufsUrl
    const url = file.ufsUrl ?? file.url;

    try {
      const existing = await prisma.media.findFirst({ where: { url } });
      if (existing) {
        console.warn('⚠️ File already exists:', url);
        return { url, skipped: true as const };
      }

      const created = await prisma.media.create({
        data: {
          name: file.name ?? 'untitled',
          url,
          size: typeof file.size === 'number' ? file.size : Number(file.size) || 0,
          type: file.type ?? 'unknown',
        },
      });

      await prisma.media.deleteMany({
        where: { name: created.name, NOT: { id: created.id } },
      });

      return { url, skipped: false as const };
    } catch (err) {
      console.error('❌ UploadThing DB error:', err);
      return { error: true as const };
    }
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
