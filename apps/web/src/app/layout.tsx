// apps/web/src/app/layout.tsx
import type { Metadata } from 'next';
import { Sora, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CuliCars — Kenya Vehicle History Intelligence',
    template: '%s | CuliCars',
  },
  description:
    'Search any Kenya number plate or VIN to reveal the full history: theft records, damage, odometer fraud, legal status, and more.',
  keywords: ['Kenya vehicle history', 'number plate check', 'VIN check Kenya', 'car history Kenya', 'NTSA records'],
  openGraph: {
    type: 'website',
    url: 'https://culicars.com',
    title: 'CuliCars — Kenya Vehicle History Intelligence',
    description: 'Search any Kenya number plate or VIN.',
    siteName: 'CuliCars',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${mono.variable}`}>
      <body className="bg-cc-bg text-cc-text antialiased">
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
