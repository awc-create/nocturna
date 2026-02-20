import type { Metadata } from 'next';
import Home from '../page';

export const metadata: Metadata = {
  title: 'Services | DJs & Live Musicians for Venues & Events',
  description:
    'Professional DJs and live musicians curated for hospitality venues, corporate events and private functions. Sound that fits the room.',
  alternates: { canonical: 'https://nocturnaagency.co.uk/services' },
  openGraph: {
    title: 'Services | DJs & Live Musicians for Venues & Events',
    description:
      'Professional DJs and live musicians curated for hospitality venues, corporate events and private functions. Sound that fits the room.',
    url: 'https://nocturnaagency.co.uk/services',
    siteName: 'Nocturna',
    type: 'website',
  },
};

export default Home;
