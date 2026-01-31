import type { Metadata } from 'next';
import Home from '../page';

export const metadata: Metadata = {
  title: 'Contact | ESSENTIA — DJ & Live Music Agency',
  description:
    'Contact ESSENTIA for hospitality venues, brand launches, corporate events or premium private functions. We’ll help you plan the right DJ and live music for your space or occasion.',
  alternates: { canonical: 'https://essentiaagency.co.uk/contact' },
  openGraph: {
    title: 'Contact | ESSENTIA — DJ & Live Music Agency',
    description:
      'Contact ESSENTIA for hospitality venues, brand launches, corporate events or premium private functions. We’ll help you plan the right DJ and live music for your space or occasion.',
    url: 'https://essentiaagency.co.uk/contact',
    siteName: 'ESSENTIA',
    type: 'website',
  },
};

export default Home;
