// src/app/admin/page.tsx
import type { Metadata } from 'next';
import AdminClient from './AdminClient';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Dr. Odera Ezenna',
  description: 'Manage blog posts, hero image, and subscribers.',
};

export default function AdminPage() {
  return <AdminClient />;
}
