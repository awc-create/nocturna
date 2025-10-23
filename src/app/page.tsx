import Hero from '@/components/home/hero/Hero';
import About from '@/components/home/about/About';
import Services from '@/components/home/services/Services';
import Clients from '@/components/home/clients/Clients';
import Contact from '@/components/home/contact/Contact';
import styles from './page.module.scss';

export default function Home() {
  return (
    <main className={styles.homeContainer}>
      <Hero />
      <About />
      <Services />
      <Clients />
      <Contact />
    </main>
  );
}
