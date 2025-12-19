import Hero from '@/components/home/hero/Hero';
import About from '@/components/home/about/About';
import Services from '@/components/home/services/Services';
import Clients from '@/components/home/clients/Clients';
import Enquire from '@/components/home/enquire/Enquire';
import Join from '@/components/home/join/Join';
import Contact from '@/components/home/contact/Contact';
import styles from './page.module.scss';
import { ModalProvider } from '@/components/home/modals/ModalContext';

export default function Home() {
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
          <Services />
        </section>

        {/* CLIENTS */}
        <section
          id="clients"
          className={`${styles.sectionDivider} ${styles.sectionDividerClients}`}
        >
          <Clients />
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
