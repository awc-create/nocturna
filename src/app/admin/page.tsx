// src/app/admin/page.tsx
import type { Metadata } from 'next';
import AdminClient from './AdminClient';

export const metadata: Metadata = {
  title: {
    default: 'Admin Dashboard',
    template: '%s | Essentia Admin',
  },

  description:
    'Internal administration panel for Essentia Artist Agency. Manage site content, media, posts, and subscribers.',

  robots: {
    index: false,
    follow: false,
    nocache: true,
  },

  applicationName: 'Essentia Admin',

  referrer: 'no-referrer',

  openGraph: {
    title: 'Essentia Admin Dashboard',
    description:
      'Secure internal dashboard for managing Essentia Artist Agency content and site operations.',
    siteName: 'Essentia',
    type: 'website',
  },

  twitter: {
    card: 'summary',
    title: 'Essentia Admin Dashboard',
    description: 'Secure internal dashboard for managing Essentia Artist Agency.',
  },

  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
};

export default function AdminPage() {
  return <AdminClient />;
}
