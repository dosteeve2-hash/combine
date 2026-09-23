import Link from 'next/link';
import { brand } from '@/lib/brand';

export function Pied() {
  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-[var(--bg2)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="titre text-2xl text-[var(--gold)]">{brand.nom}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text2)]">{brand.description}</p>
          </div>
          <nav aria-label="Liens de bas de page" className="flex gap-12 text-sm">
            <div className="flex flex-col gap-2.5">
              <span className="etiquette">Produit</span>
              <Link href="/flux" className="text-[var(--text2)] hover:text-[var(--gold)]">
                Dossiers publiés
              </Link>
              <Link href="/tarifs" className="text-[var(--text2)] hover:text-[var(--gold)]">
                Tarifs
              </Link>
              <Link href="/inscription" className="text-[var(--text2)] hover:text-[var(--gold)]">
                Créer un compte
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="etiquette">Cadre</span>
              <Link href="/cadre-legal" className="text-[var(--text2)] hover:text-[var(--gold)]">
                Cadre légal
              </Link>
              <a
                href={`mailto:${brand.contactEmail}`}
                className="text-[var(--text2)] hover:text-[var(--gold)]"
              >
                Nous écrire
              </a>
            </div>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--text3)] sm:flex-row sm:items-center sm:justify-between">
          <p className="mono">
            © {new Date().getFullYear()} {brand.editeur} · Ouagadougou
          </p>
          <p className="max-w-lg leading-relaxed">
            {brand.nom} est un outil de mise en relation et de suivi. Aucun fonds ne transite par la
            plateforme et aucun placement n&rsquo;y est proposé.
          </p>
          <p className="titre text-[var(--gold3)]">SDC</p>
        </div>
      </div>
    </footer>
  );
}
