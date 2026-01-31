// src/app/page.tsx
import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title:
    'ESSENTIA | Curated DJs & Live Music for Hospitality Venues, Brands & Events in Birmingham',
  description:
    'Curated DJs and live musicians for restaurants, bars and premium hospitality venues in Birmingham. ESSENTIA also delivers atmosphere-first music programming for brand launches and corporate events — always tailored to the room.',
  alternates: { canonical: 'https://essentiaagency.co.uk/' },
  openGraph: {
    title:
      'ESSENTIA | Curated DJs & Live Music for Hospitality Venues, Brands & Events in Birmingham',
    description:
      'Curated DJs and live musicians for restaurants, bars and premium hospitality venues in Birmingham. ESSENTIA also delivers atmosphere-first music programming for brand launches and corporate events — always tailored to the room.',
    url: 'https://essentiaagency.co.uk/',
    siteName: 'ESSENTIA',
    type: 'website',
  },
};

type ClientLogo = {
  name: string;
  src: string;
  href?: string;
  blurb?: string;
  quote?: string;
  personName?: string;
  personTitle?: string;
  storyUrl?: string;
  storyLabel?: string;
};

type Service = {
  key: string;
  title: string;
  blurb: string;
  href: string;
  image: string;
  tag: string;
  backImage?: string;
  detail?: string;
  includes?: string[];
};

type ClientsApi = {
  title?: string;
  lead?: string;
  items?: ClientLogo[];
};

type ServicesApi = {
  kicker?: string;
  title?: string;
  lead?: string;
  items?: Service[];
};

export const dynamic = 'force-dynamic';

const CLIENTS_FALLBACK: ClientsApi = {
  title: 'Our Clients',
  lead: 'Trusted by leading venues, bars and creative brands.',
  items: [
    {
      name: "Regina's Bar & Restaurant",
      src: '/assets/clients/garden.png',
      blurb: 'Restaurant & Late-Night Bar, Birmingham',
      quote: '“They keep the room perfectly tuned, from first drink to last call.”',
      personName: 'Gregorio',
      personTitle: 'General Manager',
      storyUrl: '/case-studies/reginas',
      storyLabel: 'Watch the story',
    },
    {
      name: 'Luna Lounge',
      src: '/assets/clients/luna.png',
      blurb: 'Cocktail Bar & Events',
      quote: '“Smooth, brand-safe sets that still feel fresh every week.”',
      personName: '—',
      personTitle: 'Brand Director',
    },
    {
      name: 'Stardust',
      src: '/assets/clients/stardust.png',
      blurb: 'Live Events & Private Hire',
      quote: '“Reliable rosters and zero drama with tech or timings.”',
      personName: '—',
      personTitle: 'Events Lead',
    },
    {
      name: 'Stellar',
      src: '/assets/clients/stellar.png',
      blurb: 'Late-Night Venue',
      quote: '“Guests notice the music — in a good way, not a loud way.”',
      personName: '—',
      personTitle: 'Venue Owner',
    },
    {
      name: 'Symphony Center',
      src: '/assets/clients/symphony.png',
      blurb: 'Culture & Programming',
      quote: '“They understand our audience and programme to match.”',
      personName: '—',
      personTitle: 'Programming Manager',
    },
  ],
};

const SERVICES_FALLBACK: ServicesApi = {
  kicker: 'Our Services',
  title: 'Sound that fits the room.',
  lead: 'Two core offerings to start — built to scale with your brand.',
  items: [
    {
      key: 'dj',
      title: 'DJs',
      blurb:
        'Signature selectors for restaurants, bars and late-night venues. Floor-filling sets matched to brand, guest profile, and time of day.',
      href: '#enquire',
      image: '/assets/services/djs.jpg',
      tag: 'Nightlife energy',
      backImage: '/assets/services/djs-back.jpg',
      detail:
        'Our DJ roster includes experienced selectors used to brand-fit programming, guest-flow control and multi-room setups.',
      includes: [
        'Programming aligned to time of day and atmosphere',
        'DJs briefed on volume, tone, and venue context',
        'Clear communication and artist alignment',
        'One point of contact throughout',
        'Reliable cover if availability changes',
      ],
    },
    {
      key: 'musician',
      title: 'Musicians',
      blurb:
        'Acoustic duos, sax, strings, vocalists — atmosphere-first performances curated for intimate dining and premium hospitality.',
      href: '#enquire',
      image: '/assets/services/musicians.jpg',
      tag: 'Live atmosphere',
      backImage: '/assets/services/musicians-back.jpg',
      detail:
        'We supply adaptable musicians for brunch, dinner or lounges — artists who enhance the atmosphere without overwhelming the room.',
      includes: [
        'Set formats matched to service style and energy',
        'Musicians briefed on volume, tone, and venue context',
        'Clear communication and artist alignment',
        'One point of contact throughout',
        'Reliable cover if availability changes',
      ],
    },
  ],
};

async function getBaseUrl() {
  const h = await headers(); // ✅ Next 15.5.6: async
  const host = h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

async function fetchClients(baseUrl: string): Promise<ClientsApi> {
  try {
    const res = await fetch(`${baseUrl}/api/home/clients`, { cache: 'no-store' });
    if (!res.ok) return CLIENTS_FALLBACK;
    return (await res.json()) as ClientsApi;
  } catch {
    return CLIENTS_FALLBACK;
  }
}

async function fetchServices(baseUrl: string): Promise<ServicesApi> {
  try {
    const res = await fetch(`${baseUrl}/api/home/services`, { cache: 'no-store' });
    if (!res.ok) return SERVICES_FALLBACK;
    return (await res.json()) as ServicesApi;
  } catch {
    return SERVICES_FALLBACK;
  }
}

export default async function Home() {
  const baseUrl = await getBaseUrl();

  const [clients, services] = await Promise.all([fetchClients(baseUrl), fetchServices(baseUrl)]);

  return (
    <HomeClient
      services={{
        kicker: services.kicker ?? SERVICES_FALLBACK.kicker!,
        title: services.title ?? SERVICES_FALLBACK.title!,
        lead: services.lead ?? SERVICES_FALLBACK.lead!,
        items:
          Array.isArray(services.items) && services.items.length
            ? services.items
            : (SERVICES_FALLBACK.items ?? []),
      }}
      clients={{
        title: clients.title ?? CLIENTS_FALLBACK.title!,
        lead: clients.lead ?? CLIENTS_FALLBACK.lead!,
        items:
          Array.isArray(clients.items) && clients.items.length
            ? clients.items
            : (CLIENTS_FALLBACK.items ?? []),
      }}
    />
  );
}
