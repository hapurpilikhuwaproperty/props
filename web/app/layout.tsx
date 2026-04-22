import '../app/globals.css';
import { ReactNode } from 'react';
import { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AuthProvider } from '../lib/auth-context';
import StickyCTA from '../components/StickyCTA';
import { CompareProvider } from '../lib/compare-context';
import CompareBar from '../components/CompareBar';
import WhatsAppChat from '../components/WhatsAppChat';
import { BRAND } from '../lib/constants';

export const metadata: Metadata = {
  title: BRAND.META_TITLE,
  description: BRAND.META_DESCRIPTION,
  other: {
    'link:preconnect': ['https://images.unsplash.com', 'https://res.cloudinary.com', process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <AuthProvider>
          <CompareProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <StickyCTA />
            <CompareBar />
            <WhatsAppChat />
          </CompareProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
