import type { Metadata } from 'next';
import Home from '../page';

export const metadata: Metadata = {
  title: 'Contact | Nocturna — DJ & Live Music Agency',
  description:
    'Contact Nocturna for hospitality venues, brand launches, corporate events or premium private functions. We’ll help you plan the right DJ and live music for your space or occasion.',
  alternates: { canonical: 'https://nocturnaagency.co.uk/contact' },
  openGraph: {
    title: 'Contact | Nocturna — DJ & Live Music Agency',
    description:
      'Contact Nocturna for hospitality venues, brand launches, corporate events or premium private functions. We’ll help you plan the right DJ and live music for your space or occasion.',
    url: 'https://nocturnaagency.co.uk/contact',
    siteName: 'Nocturna',
    type: 'website',
  },
};

export default Home;
