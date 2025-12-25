/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,
  reactStrictMode: true,

  images: {
    remotePatterns: [
      // UploadThing / UFS
      { protocol: 'https', hostname: 'ufs.sh' },
      { protocol: 'https', hostname: '*.ufs.sh' },

      // UploadThing legacy / UTFS
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: '*.utfs.io' },

      // UploadThing CDN domains
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: '*.uploadthing.com' },
      { protocol: 'https', hostname: 'cdn.uploadthing.com' },
    ],
    // ✅ Prefer leaving this OFF unless you really need it
    // unoptimized: true,
  },

  async headers() {
    const csp = [
      "default-src 'self'",

      // Images (UploadThing posters, data URLs)
      "img-src 'self' data: blob: https://ufs.sh https://*.ufs.sh https://utfs.io https://*.utfs.io https://cdn.uploadthing.com https://uploadthing.com https://*.uploadthing.com",

      // Video files (if you ever host videos on UploadThing)
      "media-src 'self' blob: https://ufs.sh https://*.ufs.sh https://utfs.io https://*.utfs.io https://cdn.uploadthing.com",

      // YouTube / Vimeo embeds
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",

      // API + UploadThing
      "connect-src 'self' https://*.uploadthing.com https://ufs.sh https://*.ufs.sh https://utfs.io https://*.utfs.io",

      // Basic JS/CSS (keep compatible with Next)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [{ key: 'Content-Security-Policy', value: csp }],
      },
    ];
  },
};

module.exports = nextConfig;
