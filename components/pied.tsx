import Link from 'next/link';
import Image from 'next/image';
import { brand } from '@/lib/brand';

export function Pied() {
  return (
    <footer className="site-footer">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex min-h-11 items-center" aria-label={brand.nom}>
              <Image
                src="/brand/logo-sombre.svg"
                alt=""
                width={262}
                height={88}
                className="h-auto w-[142px]"
              />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[#e3cbd3]">{brand.description}</p>
          </div>
          <nav aria-label="Liens de bas de page" className="flex gap-10 text-sm sm:gap-12">
            <div className="flex flex-col">
              <span className="etiquette text-[#d9c5cc]">COMBINE</span>
              <Link href="/#methode">Le parcours</Link>
              <Link href="/cadre-legal">Cadre et limites</Link>
              <Link href="/connexion">Accéder à l’espace privé</Link>
            </div>
            <div className="flex flex-col">
              <span className="etiquette text-[#d9c5cc]">Contact</span>
              <a
                href={`mailto:${brand.contactEmail}`}
              >
                {brand.contactEmail}
              </a>
            </div>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/15 pt-5 text-xs text-[#e3cbd3] sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono text-[#f5dde6]">
            © {new Date().getFullYear()} {brand.editeur} · Ouagadougou
          </p>
          <p className="max-w-2xl leading-relaxed">
            Prototype privé en démonstration. COMBINE conserve l’historique des publications ;
            l’exactitude des informations déclarées n’est pas auditée.
          </p>
        </div>
      </div>
    </footer>
  );
}
