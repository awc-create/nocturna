import type { Metadata } from 'next';
import Home from '../page';

export const metadata: Metadata = {
  title: 'About Nocturna | DJ & Live Music Curation for Hospitality & Events',
  description:
    'Learn about Nocturna — specialists in curated DJs and live music for hospitality venues, brands, corporate functions and private events.',
  alternates: { canonical: 'https://nocturnaagency.co.uk/about' },
  openGraph: {
    title: 'About Nocturna | DJ & Live Music Curation for Hospitality & Events',
    description:
      'Learn about Nocturna — specialists in curated DJs and live music for hospitality venues, brands, corporate functions and private events.',
    url: 'https://nocturnaagency.co.uk/about',
    siteName: 'Nocturna',
    type: 'website',
  },
};

export default Home;
