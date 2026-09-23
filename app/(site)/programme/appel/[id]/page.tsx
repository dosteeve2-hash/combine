import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, ExternalLink, Inbox, Lock } from 'lucide-react';
import { sql } from '@/lib/db';
import { exigerOrganisationGeree, exigerUtilisateur } from '@/lib/session';
import { STATUTS_CANDIDATURE, CRITERES_EVALUATION } from '@/lib/types';
import {
  BlocEvaluation,
  BoutonFermerAppel,
  BoutonsDecision,
} from '@/components/formulaires-programme';

export const metadata: Metadata = { title: 'Appel à candidatures' };
export const dynamic = 'force-dynamic';

interface LigneCandidature {
  id: string;
  statut: string;
  cree_le: string;
  dossier_id: string;
  nom: string;
  pays: string;
  ville: string | null;
  secteur: string;
  resume: string | null;
  code_public: string | null;
  ca_mensuel_fcfa: string | null;
  besoin_fcfa: string | null;
  score: number | null;
  moyenne: string | null;
  evaluateurs: number;
  equipe: number | null;
  probleme: number | null;
  traction: number | null;
  modele: number | null;
  impact: number | null;
  commentaire: string | null;
}

export default async function PageAppel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const utilisateur = await exigerUtilisateur();
  const { organisation, plan } = await exigerOrganisationGeree(utilisateur.id);

  const appels = (await sql`
    select * from appel where id = ${id} and organisation_id = ${organisation.id}
  `) as {
    id: string;
    titre: string;
    description: string | null;
    statut: string;
    score_minimum: number;
    ferme_le: string | null;
    secteurs: string[] | null;
  }[];
  const appel = appels[0];
  if (!appel) notFound();

  const candidatures = (await sql`
    select c.id, c.statut, c.cree_le, d.id as dossier_id, d.nom, d.pays, d.ville, d.secteur,
           d.resume, d.code_public, d.ca_mensuel_fcfa, d.besoin_fcfa,
           (select score from publication where dossier_id = d.id order by version desc limit 1) as score,
           (select round(avg((coalesce(equipe,0)+coalesce(probleme,0)+coalesce(traction,0)
                             +coalesce(modele,0)+coalesce(impact,0))/5.0), 1)::text
              from evaluation where candidature_id = c.id) as moyenne,
           (select count(*)::int from evaluation where candidature_id = c.id) as evaluateurs,
           e.equipe, e.probleme, e.traction, e.modele, e.impact, e.commentaire
      from candidature c
      join dossier d on d.id = c.dossier_id
      left join evaluation e on e.candidature_id = c.id and e.user_id = ${utilisateur.id}
     where c.appel_id = ${appel.id}
     order by c.cree_le desc
  `) as LigneCandidature[];

  const parStatut = (s: string) => candidatures.filter((c) => c.statut === s).length;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12">
      <Link
        href="/programme"
        className="mono inline-flex items-center gap-1.5 text-xs text-[var(--text3)] hover:text-[var(--gold)]"
      >
        <ArrowLeft size={13} aria-hidden /> {organisation.nom}
      </Link>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-6 border-b border-[var(--border)] pb-10">
        <div className="min-w-0 flex-1">
          <h1 className="titre text-3xl sm:text-4xl">{appel.titre}</h1>
          <p className="mono mt-2.5 text-xs text-[var(--text3)]">
            score minimum {appel.score_minimum}
            {appel.ferme_le && ` · clôture le ${new Date(appel.ferme_le).toLocaleDateString('fr-FR')}`}
            {' · '}
            {appel.statut}
          </p>
          {appel.description && (
            <p className="mt-5 max-w-2xl leading-relaxed text-[var(--text2)]">{appel.description}</p>
          )}
        </div>

        <div className="flex flex-col items-stretch gap-2">
          {plan.exportBailleur ? (
            <a href={`/api/appel/${appel.id}/export`} className="bouton bouton-contour">
              <Download size={15} aria-hidden /> Export bailleur
            </a>
          ) : (
            <Link href="/tarifs" className="bouton bouton-discret">
              <Lock size={14} aria-hidden /> Export bailleur — plan Programme
            </Link>
          )}

          {appel.statut !== 'ferme' && <BoutonFermerAppel appelId={appel.id} />}
        </div>
      </header>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">
        {[
          { v: candidatures.length, l: 'dossiers reçus' },
          { v: parStatut('en_evaluation'), l: 'en évaluation' },
          { v: parStatut('retenue'), l: 'retenus' },
          { v: parStatut('ecartee'), l: 'écartés' },
        ].map((s) => (
          <div key={s.l} className="bg-[var(--bg2)] px-5 py-5">
            <dt className="mono text-2xl text-[var(--gold)]">{s.v}</dt>
            <dd className="mt-1 text-xs text-[var(--text3)]">{s.l}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12 space-y-4">
        <h2 className="etiquette">Les candidatures</h2>

        {candidatures.length === 0 ? (
          <div className="carte flex flex-col items-center px-6 py-16 text-center">
            <Inbox size={28} className="text-[var(--text3)]" aria-hidden />
            <p className="mt-5 text-lg font-medium">Aucune candidature pour l&rsquo;instant</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text2)]">
              Partagez le lien de votre appel aux porteurs que vous suivez. Ceux dont le dossier
              atteint {appel.score_minimum} points pourront candidater.
            </p>
          </div>
        ) : (
          candidatures.map((c) => {
            const badge = STATUTS_CANDIDATURE[c.statut] ?? STATUTS_CANDIDATURE.recue;
            return (
              <article key={c.id} className="carte p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-medium">{c.nom}</h3>
                      <span className={`mono rounded-md px-2 py-0.5 text-[0.625rem] tracking-[0.1em] uppercase ${badge.couleur}`}>
                        {badge.libelle}
                      </span>
                    </div>
                    <p className="mono mt-1.5 text-xs text-[var(--text3)]">
                      {[c.ville, c.pays, c.secteur].filter(Boolean).join(' · ')}
                    </p>
                    {c.resume && (
                      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--text2)]">
                        {c.resume}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-start gap-6">
                    <div className="text-right">
                      <p className="mono text-2xl text-[var(--gold)]">{c.score ?? '—'}</p>
                      <p className="text-[0.625rem] text-[var(--text3)]">préparation</p>
                    </div>
                    <div className="text-right">
                      <p className="mono text-2xl text-[var(--cyan)]">{c.moyenne ?? '—'}</p>
                      <p className="text-[0.625rem] text-[var(--text3)]">
                        note · {c.evaluateurs} avis
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mono mt-5 flex flex-wrap gap-4 text-xs text-[var(--text3)]">
                  {c.ca_mensuel_fcfa && Number(c.ca_mensuel_fcfa) > 0 && (
                    <span>CA {Number(c.ca_mensuel_fcfa).toLocaleString('fr-FR')} FCFA/mois</span>
                  )}
                  {c.besoin_fcfa && Number(c.besoin_fcfa) > 0 && (
                    <span>demande {Number(c.besoin_fcfa).toLocaleString('fr-FR')} FCFA</span>
                  )}
                  {c.code_public && (
                    <Link href={`/dossier/${c.code_public}`} className="lien-or inline-flex items-center gap-1">
                      dossier complet <ExternalLink size={11} aria-hidden />
                    </Link>
                  )}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
                  <BlocEvaluation
                    candidatureId={c.id}
                    notes={{
                      equipe: c.equipe,
                      probleme: c.probleme,
                      traction: c.traction,
                      modele: c.modele,
                      impact: c.impact,
                    }}
                    commentaire={c.commentaire}
                  />

                  <div className="border-t border-[var(--border)] pt-5">
                    <p className="etiquette">Décision</p>
                    <p className="mt-3 mb-4 text-xs leading-relaxed text-[var(--text3)]">
                      La grille porte sur {CRITERES_EVALUATION.length} critères notés sur 5. La
                      décision reste la vôtre : la note éclaire, elle ne tranche pas.
                    </p>
                    <BoutonsDecision candidatureId={c.id} statut={c.statut} />
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
