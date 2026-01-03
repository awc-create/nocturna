// src/app/HomeClient.tsx
'use client';

import Hero from '@/components/home/hero/Hero';
import About from '@/components/home/about/About';
import Services from '@/components/home/services/Services';
import Clients from '@/components/home/clients/Clients';
import Enquire from '@/components/home/enquire/Enquire';
import Join from '@/components/home/join/Join';
import Contact from '@/components/home/contact/Contact';

import styles from './page.module.scss';
import { ModalProvider } from '@/components/home/modals/ModalContext';

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

type HomeClientProps = {
  services: {
    kicker: string;
    title: string;
    lead: string;
    items: Service[];
  };
  clients: {
    title: string;
    lead: string;
    items: ClientLogo[];
  };
};

export default function HomeClient({ services, clients }: HomeClientProps) {
  return (
    <ModalProvider>
      <main className={styles.homeContainer}>
        {/* HERO (no divider above the very first section) */}
        <section id="top">
          <Hero />
        </section>

        {/* ABOUT */}
        <section id="about" className={styles.sectionDivider}>
          <About />
        </section>

        {/* SERVICES */}
        <section
          id="services"
          className={`${styles.sectionDivider} ${styles.sectionDividerServices}`}
        >
          <Services
            initialKicker={services.kicker}
            initialTitle={services.title}
            initialLead={services.lead}
            initialItems={services.items}
          />
        </section>

        {/* CLIENTS */}
        <section
          id="clients"
          className={`${styles.sectionDivider} ${styles.sectionDividerClients}`}
        >
          <Clients
            initialTitle={clients.title}
            initialLead={clients.lead}
            initialLogos={clients.items}
          />
        </section>

        {/* ENQUIRE */}
        <section
          id="enquire"
          className={`${styles.sectionDivider} ${styles.sectionDividerEnquire}`}
        >
          <Enquire />
        </section>

        {/* JOIN */}
        <section id="join" className={`${styles.sectionDivider} ${styles.sectionDividerJoin}`}>
          <Join />
        </section>

        {/* CONTACT */}
        <section
          id="contact"
          className={`${styles.sectionDivider} ${styles.sectionDividerContact}`}
        >
          <Contact />
        </section>
      </main>
    </ModalProvider>
  );
}
