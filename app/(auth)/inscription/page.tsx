import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FormulaireAuth } from '@/components/formulaire-auth';
import { sessionActuelle } from '@/lib/session';
import { inscriptionDisponible, verificationEmailConfiguree } from '@/lib/email-config';

export const metadata: Metadata = { title: 'Créer un compte' };

export default async function Inscription() {
  const session = await sessionActuelle();
  if (session?.user) redirect('/tableau-de-bord');

  if (!inscriptionDisponible) {
    return (
      <>
        <h1 className="titre text-3xl">Inscription sur invitation.</h1>
        <p className="mt-2.5 mb-8 text-sm leading-relaxed text-[var(--text2)]">
          Les créations de compte sont temporairement fermées. Votre structure vous enverra un lien
          d’invitation quand l’accès sera activé.
        </p>
        <Link href="/connexion" className="bouton bouton-or w-full py-3 text-center">
          Se connecter
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="titre text-3xl">Commençons.</h1>
      <p className="mt-2.5 mb-8 text-sm leading-relaxed text-[var(--text2)]">
        Un compte suffit, que vous veniez déposer un projet, en chercher un, ou piloter un
        programme. C&rsquo;est gratuit.
      </p>
      <FormulaireAuth mode="inscription" verificationEmailConfiguree={verificationEmailConfiguree} inscriptionDisponible={inscriptionDisponible} />
    </>
  );
}
