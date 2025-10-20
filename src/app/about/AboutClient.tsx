// src/app/about/AboutClient.tsx
'use client';

import styles from './About.module.scss';
import dynamic from 'next/dynamic';
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import developerAnim from '../../assets/lottie/developer.json'; // adjust path if needed

export default function AboutClient() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <h1>About Us</h1>
        <p>We&#39;re a team of passionate developers turning ideas into reality.</p>
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
  );
}
