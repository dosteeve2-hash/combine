import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { Info, ShieldCheck } from 'lucide-react';
import { sql } from '@/lib/db';
import { STADES } from '@/lib/brand';
import { mentionScore } from '@/lib/score';
import { investisseurVerifie } from '@/lib/portefeuille';
import { AnneauScore } from '@/components/panneau-score';
import { FormulaireInteret } from '@/components/formulaire-interet';
import { organisationDe, sessionActuelle } from '@/lib/session';
import type { Dossier, Publication } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dossier privé',
  robots: { index: false, follow: false, nocache: true },
};

async function charger(code: string) {
  const dossiers = (await sql`
    select * from dossier where code_public = ${code} and publie
  `) as Dossier[];
  const dossier = dossiers[0];
  if (!dossier) return null;

  const publications = (await sql`
    select id, version, score, empreinte, publie_le
      from publication where dossier_id = ${dossier.id}
     order by version desc
  `) as Omit<Publication, 'contenu' | 'dossier_id'>[];

  return { dossier, publications };
}

const dateLongue = (v: string) =>
  new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

const montant = (v: string | number | null) =>
  v === null || Number(v) === 0 ? null : `${Number(v).toLocaleString('fr-FR')} FCFA`;

export default async function DossierFinanceur({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await sessionActuelle();
  if (!session?.user) redirect('/connexion');

  const appartenance = await organisationDe(session.user.id);
  if (!investisseurVerifie(session.user.emailVerified, appartenance?.role)) {
    redirect('/tableau-de-bord');
  }

  const donnees = await charger(code);
  if (!donnees) notFound();

  const { dossier: d, publications } = donnees;
  const derniere = publications[0];
  const premiere = publications[publications.length - 1];
  const mention = mentionScore(derniere?.score ?? 0);

  const lignesInteret = (await sql`
    select 1 from interet where dossier_id = ${d.id} and user_id = ${session.user.id}
  `) as unknown[];
  const dejaInteresse = lignesInteret.length > 0;

  const blocs = [
    { titre: 'Le problème', texte: d.probleme },
    { titre: 'La solution', texte: d.solution },
    { titre: 'Le client', texte: d.clients },
    { titre: 'Le modèle économique', texte: d.modele },
    { titre: 'La concurrence', texte: d.concurrence },
    { titre: 'L’équipe', texte: d.equipe_description },
    { titre: 'Usage des fonds recherchés', texte: d.usage_des_fonds },
  ].filter((b) => b.texte);

  const faits = [
    { l: 'Chiffre d’affaires mensuel', v: montant(d.ca_mensuel_fcfa) },
    { l: 'Clients actifs', v: d.clients_actifs ? String(d.clients_actifs) : null },
    { l: 'Taille de l’équipe', v: d.equipe_taille ? `${d.equipe_taille} personnes` : null },
    { l: 'Année de démarrage', v: d.annee_creation ? String(d.annee_creation) : null },
    { l: 'Montant recherché', v: montant(d.besoin_fcfa) },
    { l: 'Entreprise formalisée', v: d.formalise ? 'Oui (RCCM / IFU)' : null },
  ].filter((f) => f.v);

  const demonstration = d.code_public?.startsWith('DEMO-') ?? false;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      {demonstration && (
        <p
          role="note"
          className="mb-8 flex items-start gap-2.5 rounded-xl border border-[var(--gold3)] bg-[rgb(27_168_153_/_0.08)] px-4 py-3 text-sm leading-relaxed text-[var(--gold2)]"
        >
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            <strong className="font-semibold">Dossier de démonstration.</strong> Cette entreprise
            n’existe pas : les informations sont des exemples et ne constituent pas des preuves.
          </span>
        </p>
      )}

      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-[var(--border)] pb-8 sm:gap-8 sm:pb-10">
        <div className="min-w-0 flex-1">
          <p className="mono text-xs tracking-[0.12em] text-[var(--text3)] uppercase">
            Espace financeur privé · {[d.ville, d.pays].filter(Boolean).join(' · ')}
          </p>
          <h1 className="titre mt-3 text-4xl sm:text-5xl">{d.nom}</h1>
          {d.resume && (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--text2)]">{d.resume}</p>
          )}
          <div className="mono mt-6 flex flex-wrap gap-2 text-[0.6875rem]">
            {d.secteur && (
              <span className="rounded-md bg-[var(--bg3)] px-2.5 py-1 text-[var(--text2)]">
                {d.secteur}
              </span>
            )}
            <span className="rounded-md bg-[var(--bg3)] px-2.5 py-1 text-[var(--text2)]">
              {STADES.find((s) => s.valeur === d.stade)?.libelle ?? d.stade}
            </span>
            <span
              className="rounded-md px-2.5 py-1"
              style={{ color: mention.couleur, background: `${mention.couleur}1a` }}
            >
              {mention.libelle}
            </span>
          </div>
        </div>
        <AnneauScore score={derniere?.score ?? 0} taille={124} />
      </header>

      <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[1fr_19rem] lg:items-start lg:gap-10">
        <div className="min-w-0 space-y-9">
          {faits.length > 0 && (
            <section>
              <h2 className="etiquette">Informations déclarées · accès privé</h2>
              <dl className="mt-5 grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
                {faits.map((fait) => (
                  <div key={fait.l} className="bg-[var(--bg2)] px-4 py-4 sm:px-5">
                    <dt className="text-xs text-[var(--text3)]">{fait.l}</dt>
                    <dd className="mono mt-1.5 text-lg text-[var(--gold)]">{fait.v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {blocs.map((bloc) => (
            <section key={bloc.titre}>
              <h2 className="etiquette">{bloc.titre}</h2>
              <p className="mt-3 leading-relaxed whitespace-pre-line text-[var(--text2)]">
                {bloc.texte}
              </p>
            </section>
          ))}

          {d.croissance_commentaire && (
            <section>
              <h2 className="etiquette">Évolution</h2>
              <p className="mt-3 leading-relaxed whitespace-pre-line text-[var(--text2)]">
                {d.croissance_commentaire}
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="carte p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[var(--green)]" aria-hidden />
              <h2 className="text-sm font-medium">Historique de publication</h2>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-[var(--text2)]">
              {publications.length} publication{publications.length > 1 ? 's' : ''}
              {premiere && <> depuis le {dateLongue(premiere.publie_le)}</>}. Chaque ligne est
              horodatée par le serveur et n&rsquo;est jamais réécrite.
            </p>

            <ol className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">
              {publications.slice(0, 8).map((publication) => (
                <li key={publication.id} className="text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[var(--text2)]">Publication n° {publication.version}</span>
                    <span className="mono text-xs text-[var(--text3)]">
                      {dateLongue(publication.publie_le)}
                    </span>
                  </div>
                  <p className="mono mt-1 truncate text-[0.625rem] text-[var(--text3)]">
                    {publication.empreinte} · {publication.score}/100
                  </p>
                </li>
              ))}
            </ol>

            <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs leading-relaxed text-[var(--text3)]">
              Le contenu est déclaré par le porteur. COMBINE préserve la date des dépôts et
              l’intégrité de l’historique, pas l’exactitude des chiffres.
            </p>
          </section>

          <FormulaireInteret
            dossierId={d.id}
            connecte
            dejaInteresse={dejaInteresse}
            nomProjet={d.nom}
          />
        </aside>
      </div>
    </div>
  );
}
