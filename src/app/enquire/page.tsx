import type { Metadata } from 'next';
import Home from '../page';

export const metadata: Metadata = {
  title: 'Enquire | Book DJs & Live Musicians for Venues & Events',
  description:
    'Enquire about DJs or live musicians for your venue, brand launch, corporate event or private function. Tell us your vibe, schedule and space — we’ll match the right artists.',
  alternates: { canonical: 'https://nocturnaagency.co.uk/enquire' },
  openGraph: {
    title: 'Enquire | Book DJs & Live Musicians for Venues & Events',
    description:
      'Enquire about DJs or live musicians for your venue, brand launch, corporate event or private function. Tell us your vibe, schedule and space — we’ll match the right artists.',
    url: 'https://nocturnaagency.co.uk/enquire',
    siteName: 'Nocturna',
    type: 'website',
  },
};

export default Home;
