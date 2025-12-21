/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- Your existing settings ---
  output: 'standalone',
  trailingSlash: false,
  reactStrictMode: true,

  // --- Image handling (UploadThing + others) ---
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: '*.utfs.io' },
      { protocol: 'https', hostname: '*.ufs.sh' },
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: 'cdn.uploadthing.com' },
    ],
    unoptimized: true,
  },

  // --- SECURITY HEADERS (CSP FIXES POSTERS + YOUTUBE) ---
  async headers() {
    const csp = [
      "default-src 'self'",
      // Images (UploadThing posters, data URLs)
      "img-src 'self' data: blob: https://*.ufs.sh https://*.utfs.io https://cdn.uploadthing.com",
      // Video files (if you ever host videos on UploadThing)
      "media-src 'self' blob: https://*.ufs.sh https://*.utfs.io https://cdn.uploadthing.com",
      // YouTube / Vimeo embeds
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
      // API + UploadThing
      "connect-src 'self' https://*.uploadthing.com https://*.ufs.sh https://*.utfs.io",
      // Basic JS/CSS (keep compatible with Next)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
