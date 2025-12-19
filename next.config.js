/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' }, // UploadThing CDN
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: 'cdn.uploadthing.com' },
      // add any other external hosts you use for images
    ],
    // If you really want to bypass  optimization locally:
    // unoptimized: true,
  },
  // If you’re deploying to a Node server:
  // output: 'standalone',
};

module.exports = nextConfig;
