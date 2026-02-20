// src/app/faq/page.tsx
import FaqClient from './FaqClient';
import Contact from '@/components/home/contact/Contact';
import { ModalProvider } from '@/components/home/modals/ModalContext';

export const metadata = {
  title: 'FAQs | Nocturna',
  description: 'Answers to common questions from venues, events and artists working with Nocturna.',
};

export default function FaqPage() {
  return (
    <ModalProvider>
      <FaqClient />
      <Contact />
    </ModalProvider>
  );
}
