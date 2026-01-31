import type { Metadata } from 'next';
import Home from '../page';

export const metadata: Metadata = {
  title: 'About ESSENTIA | DJ & Live Music Curation for Hospitality & Events',
  description:
    'Learn about ESSENTIA — specialists in curated DJs and live music for hospitality venues, brands, corporate functions and private events.',
  alternates: { canonical: 'https://essentiaagency.co.uk/about' },
  openGraph: {
    title: 'About ESSENTIA | DJ & Live Music Curation for Hospitality & Events',
    description:
      'Learn about ESSENTIA — specialists in curated DJs and live music for hospitality venues, brands, corporate functions and private events.',
    url: 'https://essentiaagency.co.uk/about',
    siteName: 'ESSENTIA',
    type: 'website',
  },
};

export default Home;
