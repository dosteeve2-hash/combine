import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { sql } from '@/lib/db';
import { exigerUtilisateur } from '@/lib/session';
import { EditeurDossier } from '@/components/editeur-dossier';
import type { Dossier } from '@/lib/types';

export const metadata: Metadata = { title: 'Mon dossier' };
export const dynamic = 'force-dynamic';

export default async function PageEditeur() {
  const utilisateur = await exigerUtilisateur();

  const dossiers = (await sql`
    select * from dossier where user_id = ${utilisateur.id} order by cree_le asc limit 1
  `) as Dossier[];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12">
      <Link
        href="/tableau-de-bord"
        className="mono inline-flex items-center gap-1.5 text-xs text-[var(--text3)] hover:text-[var(--gold)]"
      >
        <ArrowLeft size={13} aria-hidden /> Mon espace
      </Link>

      <header className="mt-6 mb-10">
        <h1 className="titre text-3xl sm:text-4xl">
          {dossiers[0] ? 'Votre dossier' : 'Montons votre dossier'}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-[var(--text2)]">
          Répondez avec vos vrais chiffres, même petits. Un dossier honnête à 70 points convainc
          davantage qu&rsquo;un dossier gonflé à 95 — les financeurs vérifient.
        </p>
      </header>

      <EditeurDossier
        dossier={dossiers[0] ?? null}
        utilisateur={{ nom: utilisateur.name, email: utilisateur.email }}
      />
    </div>
  );
}
