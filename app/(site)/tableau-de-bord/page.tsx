import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Building2,
  ExternalLink,
  FilePlus2,
  Handshake,
  Megaphone,
  Plug,
} from 'lucide-react';
import { sql } from '@/lib/db';
import { calculerScore, mentionScore } from '@/lib/score';
import { SCORE_PUBLICATION } from '@/lib/plans';
import { exigerUtilisateur, organisationDe } from '@/lib/session';
import { peutGerer } from '@/lib/portefeuille';
import { AnneauScore } from '@/components/panneau-score';
import { BoutonCandidater } from '@/components/formulaires-programme';
import type { Dossier } from '@/lib/types';

export const metadata: Metadata = { title: 'Mon espace' };
export const dynamic = 'force-dynamic';

export default async function TableauDeBord() {
  const utilisateur = await exigerUtilisateur();

  const dossiers = (await sql`
    select * from dossier where user_id = ${utilisateur.id} order by cree_le asc limit 1
  `) as Dossier[];
  const dossier = dossiers[0] ?? null;

  const appartenance = await organisationDe(utilisateur.id);

  let interets = 0;
  let candidatures = 0;
  if (dossier) {
    const a = (await sql`select count(*)::int as n from interet where dossier_id = ${dossier.id}`) as {
      n: number;
    }[];
    const b = (await sql`
      select count(*)::int as n from candidature where dossier_id = ${dossier.id}
    `) as { n: number }[];
    interets = a[0]?.n ?? 0;
    candidatures = b[0]?.n ?? 0;
  }

  const score = dossier ? calculerScore(dossier).total : 0;
  const mention = mentionScore(score);

  const appelsOuverts = (await sql`
    select a.id, a.titre, o.nom as organisation, a.ferme_le, a.score_minimum,
           exists (
             select 1 from candidature c
              where c.appel_id = a.id and c.dossier_id = ${dossier?.id ?? null}
           ) as deja
      from appel a join organisation o on o.id = a.organisation_id
     where a.statut = 'ouvert'
     order by a.cree_le desc limit 4
  `) as {
    id: string;
    titre: string;
    organisation: string;
    ferme_le: string | null;
    score_minimum: number;
    deja: boolean;
  }[];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <p className="etiquette">Mon espace</p>
      <h1 className="titre mt-3 text-4xl">Bonjour {utilisateur.name.split(' ')[0]}.</h1>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {/* -------------------------------------------------------- mon dossier */}
        <section className="carte p-7 lg:col-span-2">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="etiquette">Mon dossier</p>
              {dossier ? (
                <>
                  <h2 className="titre mt-3 text-2xl">{dossier.nom}</h2>
                  <p className="mono mt-1.5 text-xs text-[var(--text3)]">
                    {[dossier.ville, dossier.pays].filter(Boolean).join(' · ') || 'Lieu à renseigner'}
                  </p>
                  <p className="mt-4 text-sm" style={{ color: mention.couleur }}>
                    {mention.libelle}
                    {score < SCORE_PUBLICATION && (
                      <span className="text-[var(--text2)]">
                        {' '}
                        — {SCORE_PUBLICATION - score} points avant publication
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="titre mt-3 text-2xl">Aucun dossier pour l&rsquo;instant</h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text2)]">
                    Comptez une vingtaine de minutes. Vous verrez votre score monter à chaque champ
                    rempli, et vous saurez exactement ce qu&rsquo;il manque.
                  </p>
                </>
              )}
            </div>
            {dossier && <AnneauScore score={score} taille={96} />}
          </div>

          <div className="mt-7 flex flex-wrap gap-3 border-t border-[var(--border)] pt-6">
            <Link href="/tableau-de-bord/dossier" className="bouton bouton-or">
              {dossier ? (
                'Modifier mon dossier'
              ) : (
                <>
                  <FilePlus2 size={15} aria-hidden /> Créer mon dossier
                </>
              )}
            </Link>
            {dossier?.publie && dossier.code_public && (
              <Link href={`/dossier/${dossier.code_public}`} className="bouton bouton-contour">
                <ExternalLink size={15} aria-hidden /> Voir la page publique
              </Link>
            )}
            {dossier && (
              <Link href="/tableau-de-bord/passerelle" className="bouton bouton-discret">
                <Plug size={15} aria-hidden /> Passerelle FORGE
              </Link>
            )}
          </div>

          {dossier && (
            <dl className="mt-7 grid grid-cols-3 gap-5 border-t border-[var(--border)] pt-6">
              {[
                { v: interets, l: 'intérêts reçus' },
                { v: candidatures, l: 'candidatures déposées' },
                { v: dossier.publie ? 'Publié' : 'Privé', l: 'état du dossier' },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="mono text-xl text-[var(--gold)]">{s.v}</dt>
                  <dd className="mt-1 text-xs text-[var(--text3)]">{s.l}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {/* ------------------------------------------------------- ma structure */}
        <section className="carte flex flex-col p-7">
          <p className="etiquette">Ma structure</p>
          {appartenance ? (
            <>
              <h2 className="titre mt-3 text-xl">{appartenance.organisation.nom}</h2>
              <p className="mono mt-1.5 text-xs text-[var(--text3)]">
                {appartenance.organisation.pays} · plan {appartenance.plan.nom}
              </p>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-[var(--text2)]">
                Gérez vos appels à candidatures, évaluez les dossiers reçus et suivez votre cohorte.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                {peutGerer(appartenance.role) && (
                  <Link href="/programme" className="bouton bouton-contour w-full">
                    <Megaphone size={15} aria-hidden /> Ouvrir le programme
                  </Link>
                )}
                <Link href="/portefeuille" className="bouton bouton-contour w-full">
                  <Briefcase size={15} aria-hidden /> Voir le portefeuille
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="titre mt-3 text-xl">Vous accompagnez des projets ?</h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--text2)]">
                Incubateur, fonds, agence ou réseau d&rsquo;investisseurs : créez votre structure
                pour lancer des appels à candidatures et évaluer les dossiers reçus.
              </p>
              <Link href="/programme/creer" className="bouton bouton-contour mt-6 w-full">
                <Building2 size={15} aria-hidden /> Créer ma structure
              </Link>
            </>
          )}
        </section>
      </div>

      {/* ------------------------------------------------------- appels ouverts */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="etiquette">Appels à candidatures ouverts</p>
            <h2 className="titre mt-3 text-2xl">Où déposer votre dossier</h2>
          </div>
          <Link href="/flux" className="lien-or mono text-xs tracking-[0.1em] uppercase">
            Voir le flux
          </Link>
        </div>

        {appelsOuverts.length === 0 ? (
          <p className="carte mt-6 px-6 py-10 text-center text-sm text-[var(--text2)]">
            Aucun appel ouvert pour l&rsquo;instant. Publiez votre dossier : les structures
            parcourent le flux même hors période de candidature.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {appelsOuverts.map((a) => (
              <li key={a.id} className="carte flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.titre}</p>
                  <p className="mono mt-1 text-xs text-[var(--text3)]">
                    {a.organisation} · score min. {a.score_minimum}
                    {a.ferme_le &&
                      ` · clôture le ${new Date(a.ferme_le).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
                {dossier?.publie ? (
                  <BoutonCandidater appelId={a.id} deja={a.deja} />
                ) : (
                  <Handshake size={17} className="shrink-0 text-[var(--gold3)]" aria-hidden />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {!dossier && (
        <section className="carte mt-12 flex flex-wrap items-center justify-between gap-5 p-7">
          <div>
            <h2 className="titre text-xl">Par où commencer</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--text2)]">
              Remplissez d&rsquo;abord l&rsquo;identité et la traction. Ce sont les deux sections que
              les financeurs lisent en premier — et celles qui pèsent le plus dans votre score.
            </p>
          </div>
          <Link href="/tableau-de-bord/dossier" className="bouton bouton-or">
            Commencer <ArrowRight size={15} aria-hidden />
          </Link>
        </section>
      )}
    </div>
  );
}
