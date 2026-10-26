import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Logo } from './logo';
import { organisationDe, sessionActuelle } from '@/lib/session';
import { investisseurVerifie } from '@/lib/portefeuille';
import { BoutonDeconnexion } from './bouton-deconnexion';

const liens = [
  { href: '/#methode', libelle: 'Le parcours' },
  { href: '/cadre-legal', libelle: 'Cadre légal' },
  { href: '/flux', libelle: 'Dossiers privés' },
] as const;

export async function Entete() {
  const session = await sessionActuelle();
  const appartenance =
    session?.user.emailVerified === true ? await organisationDe(session.user.id) : null;
  const liensVisibles = liens.filter(
    (l) => l.href !== '/flux' || investisseurVerifie(session?.user.emailVerified, appartenance?.role),
  );

  return (
    <header className="site-header">
      <div className="mx-auto flex min-h-[4.5rem] w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Navigation principale" className="site-nav hidden items-center gap-5 md:flex lg:gap-7">
          {liensVisibles.map((l) => (
            <Link
              key={l.href}
              href={l.href}
            >
              {l.libelle}
            </Link>
          ))}
        </nav>

        <details className="mobile-nav md:hidden">
          <summary aria-label="Ouvrir la navigation">
            <Menu size={19} aria-hidden />
          </summary>
          <nav aria-label="Navigation mobile" className="mobile-nav__panneau">
            {liensVisibles.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.libelle}
              </Link>
            ))}
          </nav>
        </details>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link href="/tableau-de-bord" className="bouton bouton-contour px-2.5 text-xs sm:px-4 sm:text-sm">
                Mon espace
              </Link>
              <BoutonDeconnexion className="bouton bouton-contour px-2.5 sm:px-4" iconeSeule />
            </>
          ) : (
            <Link href="/connexion" className="bouton bouton-discret px-2.5 sm:px-4">
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
