import Link from 'next/link';
import { Logo } from '@/components/logo';
import { brand } from '@/lib/brand';

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Logo />
          <Link href="/" className="mono text-xs text-[var(--text3)] hover:text-[var(--gold)]">
            ← Retour au site
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      <footer className="border-t border-[var(--border)] py-6 text-center">
        <p className="mono text-xs text-[var(--text3)]">
          {brand.nom} · {brand.editeur}
        </p>
      </footer>
    </div>
  );
}
