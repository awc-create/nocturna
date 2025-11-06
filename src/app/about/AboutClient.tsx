// src/app/about/AboutClient.tsx
'use client';

import styles from './About.module.scss';
import dynamic from 'next/dynamic';

// Sections (component-per-section, same as Home style)
import AboutHero from '@/components/about/hero/Hero';

// Example: future sections
// import Founders from '@/components/about/founders/Founders';
// import Values from '@/components/about/values/Values';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import developerAnim from '@/assets/lottie/developer.json'; // adjust if your path differs

export default function AboutClient() {
  return (
    <div className={styles.AboutContainer}>
      {/* HERO */}
      <AboutHero />

      {/* Below are placeholders you can swap to real components any time */}
      <section data-section="after-hero" className={styles.section}>
        <div className={styles.split}>
          <div className={styles.left}>
            <h2>About Us</h2>
            <p>We’re a boutique music & nightlife team shaping atmosphere-first experiences.</p>
            <ul>
              <li>🚀 Fast & scalable</li>
              <li>🎨 Design-driven</li>
              <li>🤝 Client-focused</li>
            </ul>
          </div>
          <div className={styles.right}>
            <Lottie animationData={developerAnim} loop autoplay style={{ height: 300 }} />
          </div>
        </div>
      </section>

      {/* <Founders /> */}
      {/* <Values /> */}
    </div>
  );
}
