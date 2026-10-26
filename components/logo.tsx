import Link from 'next/link';
import Image from 'next/image';
import { brand } from '@/lib/brand';

export function Logo({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2.5"
      aria-label={brand.nom}
    >
      <Image
        src="/brand/logo.svg"
        alt=""
        width={214}
        height={64}
        className="h-auto w-[116px] sm:w-[138px]"
      />
      {!compact && (
        <span className="hidden border-l border-[var(--border)] pl-2.5 text-xs font-medium text-[var(--text3)] sm:inline">
          {brand.editeur}
        </span>
      )}
    </Link>
  );
}
