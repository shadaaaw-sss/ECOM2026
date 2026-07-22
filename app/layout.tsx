import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import DirectionWrapper from '@/components/DirectionWrapper';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://makhmal.com'),
  title: 'Makhmal Beauty - Premium Skincare & Cosmetics',
  description: 'Discover premium skincare, makeup, fragrances and beauty essentials from the world\'s most trusted cosmetic brands. 100% authentic products.',
  keywords: 'skincare, makeup, beauty, cosmetics, fragrances, Lancôme, Estée Lauder, The Ordinary, Vichy',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Makhmal Beauty - Premium Skincare & Cosmetics',
    description: 'Premium beauty products from trusted international brands.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background flex flex-col">
        <LanguageProvider>
          <CurrencyProvider>
            <AuthProvider>
              <CartProvider>
                <DirectionWrapper>
                  <Navbar />
                  <main className="flex-1">
                    {children}
                  </main>
                  <Footer />
                </DirectionWrapper>
              </CartProvider>
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
