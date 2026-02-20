// src/app/admin/page.tsx
import type { Metadata } from 'next';
import AdminClient from './AdminClient';

export const metadata: Metadata = {
  title: {
    default: 'Admin Dashboard',
    template: '%s | Nocturna Admin',
  },

  description:
    'Internal administration panel for Nocturna Artist Agency. Manage site content, media, posts, and subscribers.',

  robots: {
    index: false,
    follow: false,
    nocache: true,
  },

  applicationName: 'Nocturna Admin',

  referrer: 'no-referrer',

  openGraph: {
    title: 'Nocturna Admin Dashboard',
    description:
      'Secure internal dashboard for managing Nocturna Artist Agency content and site operations.',
    siteName: 'Nocturna',
    type: 'website',
  },

  twitter: {
    card: 'summary',
    title: 'Nocturna Admin Dashboard',
    description: 'Secure internal dashboard for managing Nocturna Artist Agency.',
  },

  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
};

export default function AdminPage() {
  return <AdminClient />;
}
