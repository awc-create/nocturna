import '@/styles/Global.scss';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import SkyOverlay from '@/components/theme/SkyOverlay';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* SKY: fixed background layers */}
        <SkyOverlay
          mode="hybrid"
          strength={1}
          topPaddingPx={70}
          starDensityPct={15} // ← 0..100. Try 10, 25, 40, etc.
        />

        {/* Subtle film grain ABOVE sky, BELOW content */}
        <div className="site-grain" aria-hidden="true" />

        {/* All page content */}
        <div className="app-shell">
          <Navbar />
          <main>{children}</main>
          <Footer />
        </div>

        {/* Optional: quick visual proof that z-planes are correct */}
        {/*
        <div className="__debug-proof" />
        */}
      </body>
    </html>
  );
}
