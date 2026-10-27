import type { Metadata, Viewport } from 'next';
import { Familjen_Grotesk } from 'next/font/google';
import localFont from 'next/font/local';
import { brand } from '@/lib/brand';
import './globals.css';

const familjen = Familjen_Grotesk({
  variable: '--police-titre',
  display: 'swap',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const outfit = localFont({
  variable: '--police-corps',
  display: 'swap',
  src: [{ path: './polices/outfit.woff2', weight: '100 900', style: 'normal' }],
  fallback: ['system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

const mono = localFont({
  variable: '--police-mono',
  display: 'swap',
  src: [{ path: './polices/jetbrains-mono.woff2', weight: '100 800', style: 'normal' }],
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
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
  themeColor: '#f7f5f0',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${familjen.variable} ${outfit.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
