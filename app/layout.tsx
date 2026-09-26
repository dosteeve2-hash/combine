import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { brand } from '@/lib/brand';
import './globals.css';

/*
 * Polices auto-hébergées — voir `app/polices/LICENCES.md`.
 *
 * `next/font/google` télécharge les fichiers pendant `next build`. Le 23/09/2026
 * c'est ce qui a fait tomber la CI de la PR #1 : le remplaceur de polices de
 * Turbopack a échoué sur JetBrains Mono et le build s'est arrêté sur un
 * `module-not-found` sans rapport avec le code. Un build qui dépend d'un service
 * tiers n'est pas reproductible.
 *
 * Ce sont des polices **variables** : un seul fichier couvre tout l'axe de
 * graisse, d'où `weight: '400 900'` plutôt qu'une liste. Quatre fichiers,
 * 139 Ko, contre douze sans cela.
 */
const playfair = localFont({
  variable: '--police-titre',
  display: 'swap',
  // Playfair sert à la fois aux titres romains et à la signature italique.
  src: [
    { path: './polices/playfair-display.woff2', weight: '400 900', style: 'normal' },
    { path: './polices/playfair-display-italic.woff2', weight: '400 900', style: 'italic' },
  ],
  // Mesurée sur Georgia, la police à empattement la plus répandue : limite le
  // saut de mise en page pendant le `swap`.
  fallback: ['Georgia', 'Times New Roman', 'serif'],
  adjustFontFallback: 'Times New Roman',
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
