import Link from 'next/link';
import { brand } from '@/lib/brand';

export function Logo({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5" aria-label={brand.nom}>
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        aria-hidden
        className="shrink-0 transition-transform duration-300 group-hover:rotate-90"
      >
        <rect x="1" y="1" width="11" height="11" rx="2.5" stroke="var(--gold)" strokeWidth="1.6" />
        <rect x="14" y="14" width="11" height="11" rx="2.5" stroke="var(--gold)" strokeWidth="1.6" />
        <path d="M12 6.5h5a2.5 2.5 0 0 1 2.5 2.5v5" stroke="var(--cyan)" strokeWidth="1.6" />
      </svg>
      <span className="mono text-[0.9375rem] font-medium tracking-[0.2em] text-[var(--text)]">
        {brand.nom}
      </span>
      {/* --text2 et non --text3 : l'en-tête est translucide, donc le fond réel
          dépend de ce qui défile dessous, et le jeton le plus sombre y tombait
          à 3,59 : 1 sur la page d'un appel. */}
      {!compact && (
        <span className="etiquette hidden border-l border-[var(--border2)] pl-2.5 text-[var(--text2)] sm:inline">
          {brand.editeur}
        </span>
      )}
    </Link>
  );
}
