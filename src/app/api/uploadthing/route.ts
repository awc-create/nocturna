// Force Node runtime (Prisma + UploadThing need Node, not Edge)
export const runtime = 'nodejs';

import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from './core';

// Expose UploadThing at /api/uploadthing
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
