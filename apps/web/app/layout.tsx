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
    default: 'Night Cypher',
    template: '%s · Night Cypher',
  },
  description:
    'Underground dance battles, jams, and workshops across Mumbai, Delhi, Bengaluru, and Pune.',
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
