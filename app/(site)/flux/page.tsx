import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight, Inbox } from 'lucide-react';
import { sql } from '@/lib/db';
import { PAYS, SECTEURS, STADES } from '@/lib/brand';
import { mentionScore } from '@/lib/score';
import { organisationDe, sessionActuelle } from '@/lib/session';
import { investisseurVerifie } from '@/lib/portefeuille';

export const metadata: Metadata = {
  title: 'Espace financeur',
  description: 'Dossiers accessibles aux membres investisseurs invités.',
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

interface Ligne {
  id: string;
  nom: string;
  secteur: string;
  pays: string;
  ville: string | null;
  stade: string;
  resume: string | null;
  besoin_fcfa: string | null;
  code_public: string;
  score: number;
  publications: number;
  derniere_publication: string;
}

const libelleStade = (v: string) => STADES.find((s) => s.valeur === v)?.libelle ?? v;

export default async function Flux({
  searchParams,
}: {
  searchParams: Promise<{ pays?: string; secteur?: string; stade?: string }>;
}) {
  const session = await sessionActuelle();
  if (!session?.user) redirect('/connexion');
  const appartenance = await organisationDe(session.user.id);
  if (!investisseurVerifie(session.user.emailVerified, appartenance?.role)) redirect('/tableau-de-bord');

  const f = await searchParams;
  const pays = f.pays ?? '';
  const secteur = f.secteur ?? '';
  const stade = f.stade ?? '';

  const lignes = (await sql`
    select d.id, d.nom, d.secteur, d.pays, d.ville, d.stade, d.resume, d.besoin_fcfa,
           d.code_public,
           p.score,
           (select count(*)::int from publication where dossier_id = d.id) as publications,
           p.publie_le as derniere_publication
      from dossier d
      join lateral (
        select score, publie_le from publication
         where dossier_id = d.id order by version desc limit 1
      ) p on true
     where d.publie
       and (${pays} = '' or d.pays = ${pays})
       and (${secteur} = '' or d.secteur = ${secteur})
       and (${stade} = '' or d.stade = ${stade})
     order by p.publie_le desc
     limit 60
  `) as Ligne[];

  return (
    <>
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto w-full max-w-6xl px-5 pt-16 pb-12">
          <p className="etiquette">Espace financeur privé</p>
          <h1 className="titre mt-4 max-w-3xl text-4xl sm:text-5xl">
            Des dossiers suivis, datés, et vérifiables.
          </h1>
          <p className="mt-6 max-w-2xl leading-relaxed text-[var(--text2)]">
            Les dossiers partagés avec les membres investisseurs présentent leur niveau de
            préparation et leur historique de publication. COMBINE n&rsquo;exécute aucune transaction.
          </p>

          <form className="mt-10 flex flex-wrap items-end gap-3" method="get">
            <label className="min-w-40 flex-1 sm:max-w-56">
              <span className="etiquette mb-2 block">Pays</span>
              <select name="pays" defaultValue={pays} className="champ">
                <option value="">Tous les pays</option>
                {PAYS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-40 flex-1 sm:max-w-56">
              <span className="etiquette mb-2 block">Secteur</span>
              <select name="secteur" defaultValue={secteur} className="champ">
                <option value="">Tous les secteurs</option>
                {SECTEURS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-40 flex-1 sm:max-w-56">
              <span className="etiquette mb-2 block">Stade</span>
              <select name="stade" defaultValue={stade} className="champ">
                <option value="">Tous les stades</option>
                {STADES.map((s) => (
                  <option key={s.valeur} value={s.valeur}>
                    {s.libelle}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="bouton bouton-contour">
              Filtrer
            </button>
            {(pays || secteur || stade) && (
              <Link href="/flux" className="bouton bouton-discret">
                Tout afficher
              </Link>
            )}
          </form>
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-6xl px-5 py-14">
          <p className="mono mb-7 text-xs text-[var(--text3)]">
            {lignes.length} dossier{lignes.length > 1 ? 's' : ''}
          </p>

          {lignes.length === 0 ? (
            <div className="carte flex flex-col items-center px-6 py-20 text-center">
              <Inbox size={30} className="text-[var(--text3)]" aria-hidden />
              <p className="mt-5 text-lg font-medium">Aucun dossier ne correspond.</p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text2)]">
                Élargissez vos filtres, ou soyez le premier à publier un dossier dans cette
                catégorie.
              </p>
              <Link href="/inscription" className="bouton bouton-or mt-7">
                Déposer mon projet
              </Link>
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {lignes.map((d) => {
                const mention = mentionScore(d.score);
                return (
                  <li key={d.id}>
                    <Link
                      href={`/dossier/${d.code_public}`}
                      className="carte group flex h-full flex-col p-6 transition-colors hover:border-[var(--gold3)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="text-lg leading-snug font-medium group-hover:text-[var(--gold)]">
                            {d.nom}
                            {d.code_public.startsWith('DEMO-') && (
                              <span className="mono ml-2 rounded bg-[rgb(240_168_50_/_0.12)] px-1.5 py-0.5 align-middle text-[0.625rem] tracking-[0.1em] text-[var(--gold2)] uppercase">
                                démo
                              </span>
                            )}
                          </h2>
                          <p className="mono mt-1 text-xs text-[var(--text3)]">
                            {[d.ville, d.pays].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <span
                          className="mono shrink-0 rounded-lg px-2.5 py-1 text-xs"
                          style={{ color: mention.couleur, background: `${mention.couleur}1a` }}
                        >
                          {d.score}
                        </span>
                      </div>

                      {d.resume && (
                        <p className="mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--text2)]">
                          {d.resume}
                        </p>
                      )}

                      <div className="mono mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4 text-[0.6875rem] text-[var(--text3)]">
                        {d.secteur && (
                          <span className="rounded-md bg-[var(--bg3)] px-2 py-1">{d.secteur}</span>
                        )}
                        <span className="rounded-md bg-[var(--bg3)] px-2 py-1">
                          {libelleStade(d.stade)}
                        </span>
                        {d.besoin_fcfa && Number(d.besoin_fcfa) > 0 && (
                          <span className="rounded-md bg-[var(--bg3)] px-2 py-1 text-[var(--gold)]">
                            {Number(d.besoin_fcfa).toLocaleString('fr-FR')} FCFA
                          </span>
                        )}
                        <span className="ml-auto inline-flex items-center gap-1">
                          {d.publications} publication{d.publications > 1 ? 's' : ''}
                          <ArrowUpRight size={12} aria-hidden />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
