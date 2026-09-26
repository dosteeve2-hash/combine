import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FormulaireAuth } from '@/components/formulaire-auth';
import { sessionActuelle } from '@/lib/session';
import { inscriptionDisponible, verificationEmailConfiguree } from '@/lib/email-config';

export const metadata: Metadata = { title: 'Connexion' };

export default async function Connexion() {
  const session = await sessionActuelle();
  if (session?.user) redirect('/tableau-de-bord');

  return (
    <>
      <h1 className="titre text-3xl">Content de vous revoir.</h1>
      <p className="mt-2.5 mb-8 text-sm leading-relaxed text-[var(--text2)]">
        Reprenez votre dossier là où vous l&rsquo;avez laissé.
      </p>
      <FormulaireAuth mode="connexion" verificationEmailConfiguree={verificationEmailConfiguree} inscriptionDisponible={inscriptionDisponible} />
    </>
  );
}
