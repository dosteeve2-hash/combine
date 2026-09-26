import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FormulaireOrganisation } from '@/components/formulaires-programme';
import { exigerUtilisateur, organisationDe } from '@/lib/session';

export const metadata: Metadata = { title: 'Créer ma structure' };
export const dynamic = 'force-dynamic';

export default async function CreerStructure() {
  const utilisateur = await exigerUtilisateur();
  if (await organisationDe(utilisateur.id)) redirect('/programme');

  return (
    <div className="mx-auto w-full max-w-lg px-5 py-16">
      <p className="etiquette">Votre structure</p>
      <h1 className="titre mt-3 text-3xl">Incubateur, fonds, agence ou réseau.</h1>
      <p className="mt-4 mb-9 leading-relaxed text-[var(--text2)]">
        Une structure vous permet d&rsquo;ouvrir des appels à candidatures, de recevoir des dossiers
        déjà instruits et de les évaluer à plusieurs sur une grille commune.
      </p>
      <FormulaireOrganisation />
    </div>
  );
}
