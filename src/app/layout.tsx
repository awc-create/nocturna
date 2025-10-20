import '@/styles/Global.scss';
import Footer from '@/components/footer/Footer';
import AnimatedNavbarHost from '@/components/navbar/AnimatedNavbarHost';
import { DEFAULT_NAV, type NavSlug } from '@/components/navbar/registry';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const envSlug = process.env.NEXT_PUBLIC_NAV_VARIANT as NavSlug | undefined;
  const initialSlug = envSlug || DEFAULT_NAV;

  return (
    <html lang="en">
      <body>
        <AnimatedNavbarHost initialSlug={initialSlug} />

        {/* If your site scrolls inside main, this marks it as the scroll root for the observer */}
        <main data-scroll-root>{children}</main>

        {/* 1px sentinel right before the footer — triggers as soon as ANY footer pixel appears */}
        <div id="footer-sentinel" aria-hidden="true" style={{ height: 1 }} />

        <Footer />
      </body>
    </html>
  );
}
