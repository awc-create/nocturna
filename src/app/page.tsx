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
        {/* HERO */}
        <section id="top">
          <Hero />
        </section>

        {/* ABOUT */}
        <section id="about">
          <About />
        </section>

        {/* SERVICES */}
        <section id="services">
          <Services />
        </section>

        {/* CLIENTS */}
        <section id="clients">
          <Clients />
        </section>

        {/* ENQUIRE */}
        <section id="enquire">
          <Enquire />
        </section>

        {/* JOIN */}
        <section id="join">
          <Join />
        </section>

        {/* CONTACT */}
        <section id="contact">
          <Contact />
        </section>
      </main>
    </ModalProvider>
  );
}
