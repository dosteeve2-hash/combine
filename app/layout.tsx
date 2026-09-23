import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Outfit, JetBrains_Mono } from 'next/font/google';
import { brand } from '@/lib/brand';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--police-titre',
  weight: ['700', '800', '900'],
  style: ['italic', 'normal'],
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--police-corps',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--police-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${brand.nom} — ${brand.baseline}`,
    template: `%s · ${brand.nom}`,
  },
  description: brand.description,
  applicationName: brand.nom,
  authors: [{ name: brand.auteur }],
  openGraph: {
    title: `${brand.nom} — ${brand.baseline}`,
    description: brand.description,
    type: 'website',
    locale: 'fr_FR',
  },
};

export const viewport: Viewport = {
  themeColor: '#070e1f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${outfit.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
