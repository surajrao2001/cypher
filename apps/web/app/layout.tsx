import type { Metadata } from 'next';
import { Barlow, Bebas_Neue } from 'next/font/google';

import { Providers } from '@/app/providers';
import '@cypher/tokens/css';
import '@/styles/globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const barlow = Barlow({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BYND8',
    template: '%s · BYND8',
  },
  description:
    'Dance is counted in eights. The scene isn’t. Discover battles, jams, workshops — register and show up.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
  openGraph: {
    title: 'BYND8 — Everything Beyond the Count',
    description: 'Dance is counted in eights. The scene isn’t.',
    images: [{ url: '/og/bynd8-og.png' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${bebasNeue.variable} ${barlow.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh bg-bg font-body text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
