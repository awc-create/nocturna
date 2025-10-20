// src/app/about/page.tsx
import AboutClient from './AboutClient';

export const metadata = {
  title: 'About Us',
  description: 'Discover who we are and what we do.',
};

export default function AboutPage() {
  return (
    <main className="needs-nav-offset">
      <AboutClient />
    </main>
  );
}
