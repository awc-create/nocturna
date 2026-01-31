import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://essentiaagency.co.uk';

  const paths = ['/', '/about', '/services', '/clients', '/enquire', '/join', '/contact'];

  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
