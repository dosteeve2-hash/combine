import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const donnees = await charger(code);
  if (!donnees) return { title: 'Dossier introuvable' };
  return {
    title: donnees.dossier.nom,
    description: donnees.dossier.resume ?? undefined,
    robots: { index: false, follow: false },
  };
}

const dateLongue = (v: string) =>
  new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

const montant = (v: string | number | null) =>
  v === null || Number(v) === 0 ? null : `${Number(v).toLocaleString('fr-FR')} FCFA`;

export default async function PageDossier({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const donnees = await charger(code);
  if (!donnees) notFound();

  const { dossier: d, publications } = donnees;
  const derniere = publications[0];
  const premiere = publications[publications.length - 1];
  const mention = mentionScore(derniere?.score ?? 0);

  const session = await sessionActuelle();
  const appartenance =
    session?.user.emailVerified === true ? await organisationDe(session.user.id) : null;
  const investisseurAutorise = investisseurVerifie(session?.user.emailVerified, appartenance?.role);
  let dejaInteresse = false;
  if (session?.user && investisseurAutorise) {
    const lignes = (await sql`
      select 1 from interet where dossier_id = ${d.id} and user_id = ${session.user.id}
    `) as unknown[];
    dejaInteresse = lignes.length > 0;
  }

  const blocs = [
    { titre: 'Le problème', texte: d.probleme },
    { titre: 'La solution', texte: d.solution },
    { titre: 'Le client', texte: d.clients },
    { titre: 'Le modèle économique', texte: d.modele },
    { titre: 'La concurrence', texte: d.concurrence },
    { titre: 'L’équipe', texte: d.equipe_description },
    ...(investisseurAutorise ? [{ titre: 'Usage des fonds recherchés', texte: d.usage_des_fonds }] : []),
  ].filter((b) => b.texte);

  const faits = [
    { l: 'Chiffre d’affaires mensuel', v: montant(d.ca_mensuel_fcfa) },
    { l: 'Clients actifs', v: d.clients_actifs ? String(d.clients_actifs) : null },
    { l: 'Taille de l’équipe', v: d.equipe_taille ? `${d.equipe_taille} personnes` : null },
    { l: 'Année de démarrage', v: d.annee_creation ? String(d.annee_creation) : null },
    ...(investisseurAutorise ? [{ l: 'Montant recherché', v: montant(d.besoin_fcfa) }] : []),
    { l: 'Entreprise formalisée', v: d.formalise ? 'Oui (RCCM / IFU)' : null },
  ].filter((f) => f.v);

  // Un produit qui vend la vérifiabilité ne peut pas présenter une entreprise
  // inventée comme les autres. Les dossiers de démonstration portent un code
  // `DEMO-…` : on le dit en haut de la page, avant tout le reste.
  const demonstration = d.code_public?.startsWith('DEMO-') ?? false;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-14">
      {demonstration && (
        <p
          role="note"
          className="mb-8 flex items-start gap-2.5 rounded-xl border border-[var(--gold3)] bg-[rgb(240_168_50_/_0.08)] px-4 py-3 text-sm leading-relaxed text-[var(--gold2)]"
        >
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            <strong className="font-semibold">Dossier de démonstration.</strong> Cette
            entreprise n’existe pas : elle sert à montrer ce que COMBINE produit. Les
            dossiers réels ne portent pas de code commençant par «&nbsp;DEMO&nbsp;».
          </span>
        </p>
      )}
      <header className="flex flex-wrap items-start justify-between gap-8 border-b border-[var(--border)] pb-10">
        <div className="min-w-0 flex-1">
          <p className="mono text-xs tracking-[0.12em] text-[var(--text3)] uppercase">
            {[d.ville, d.pays].filter(Boolean).join(' · ')}
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

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_19rem] lg:items-start">
        <div className="min-w-0 space-y-10">
          {faits.length > 0 && (
            <section>
              <h2 className="etiquette">Les faits déclarés</h2>
              <dl className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
                {faits.map((f) => (
                  <div key={f.l} className="bg-[var(--bg2)] px-5 py-4">
                    <dt className="text-xs text-[var(--text3)]">{f.l}</dt>
                    <dd className="mono mt-1.5 text-lg text-[var(--gold)]">{f.v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {blocs.map((b) => (
            <section key={b.titre}>
              <h2 className="etiquette">{b.titre}</h2>
              <p className="mt-3 leading-relaxed whitespace-pre-line text-[var(--text2)]">
                {b.texte}
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
          <section className="carte p-6">
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
              {publications.slice(0, 8).map((p) => (
                <li key={p.id} className="text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[var(--text2)]">Publication n° {p.version}</span>
                    <span className="mono text-xs text-[var(--text3)]">
                      {dateLongue(p.publie_le)}
                    </span>
                  </div>
                  <p className="mono mt-1 truncate text-[0.625rem] text-[var(--text3)]">
                    {p.empreinte} · {p.score}/100
                  </p>
                </li>
              ))}
            </ol>

            <p className="mt-5 border-t border-[var(--border)] pt-4 text-xs leading-relaxed text-[var(--text3)]">
              Le contenu ci-dessus est déclaré par le porteur. COMBINE certifie la date des dépôts et
              l&rsquo;intégrité de l&rsquo;historique, pas l&rsquo;exactitude des chiffres.
            </p>
          </section>

          {investisseurAutorise ? (
            <FormulaireInteret
              dossierId={d.id}
              connecte
              dejaInteresse={dejaInteresse}
              nomProjet={d.nom}
            />
          ) : (
            <p className="carte p-5 text-sm leading-relaxed text-[var(--text2)]">
              Cette page conserve l&rsquo;historique vérifiable des informations publiées par le
              porteur. Les détails de financement sont réservés aux membres investisseurs invités.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
