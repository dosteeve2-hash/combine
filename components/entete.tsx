import Link from 'next/link';
import { Logo } from './logo';
import { organisationDe, sessionActuelle } from '@/lib/session';
import { investisseurVerifie } from '@/lib/portefeuille';
import { BoutonDeconnexion } from './bouton-deconnexion';

const liens = [
  { href: '/flux', libelle: 'Dossiers' },
  { href: '/tarifs', libelle: 'Tarifs' },
  { href: '/cadre-legal', libelle: 'Cadre légal' },
] as const;

export async function Entete() {
  const session = await sessionActuelle();
  const appartenance =
    session?.user.emailVerified === true ? await organisationDe(session.user.id) : null;
  const liensVisibles = liens.filter(
    (l) => l.href !== '/flux' || investisseurVerifie(session?.user.emailVerified, appartenance?.role),
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Logo />

        <nav aria-label="Navigation principale" className="hidden items-center gap-7 md:flex">
          {liensVisibles.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="mono text-xs tracking-[0.1em] text-[var(--text2)] uppercase transition-colors hover:text-[var(--gold)]"
            >
              {l.libelle}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link href="/tableau-de-bord" className="bouton bouton-contour">
                Mon espace
              </Link>
              <BoutonDeconnexion className="bouton bouton-or" iconeSeule />
            </>
          ) : (
            <>
              <Link href="/connexion" className="bouton bouton-discret hidden sm:inline-flex">
                Se connecter
              </Link>
              <Link href="/inscription" className="bouton bouton-or">
                Commencer
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
