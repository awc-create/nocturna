import '@/styles/Global.scss';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import SkyOverlay from '@/components/theme/SkyOverlay';
import Providers from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="app-shell">
            {/* 🌌 SKY */}
            <SkyOverlay starDensityPct={18} />

            {/* 🌫 FILM GRAIN */}
            <div className="site-grain" aria-hidden="true" />

            <Navbar />
            <main>{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
