import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Inbox, Lock } from 'lucide-react';
import { sql } from '@/lib/db';
import { illimite } from '@/lib/plans';
import { exigerOrganisationGeree, exigerUtilisateur } from '@/lib/session';
import { FormulaireAppel } from '@/components/formulaires-programme';

export const metadata: Metadata = { title: 'Mon programme' };
export const dynamic = 'force-dynamic';

interface LigneAppel {
  id: string;
  titre: string;
  statut: string;
  ferme_le: string | null;
  score_minimum: number;
  recues: number;
  retenues: number;
}

export default async function Programme() {
  const utilisateur = await exigerUtilisateur();
  const { organisation, plan } = await exigerOrganisationGeree(utilisateur.id);

  const appels = (await sql`
    select a.id, a.titre, a.statut, a.ferme_le, a.score_minimum,
           (select count(*)::int from candidature where appel_id = a.id) as recues,
           (select count(*)::int from candidature where appel_id = a.id and statut = 'retenue') as retenues
      from appel a
     where a.organisation_id = ${organisation.id}
     order by a.cree_le desc
  `) as LigneAppel[];

  const ouverts = appels.filter((a) => a.statut === 'ouvert').length;
  const totalRecues = appels.reduce((s, a) => s + a.recues, 0);
  const totalRetenues = appels.reduce((s, a) => s + a.retenues, 0);
  const quotaAtteint = !illimite(plan.appelsActifs) && ouverts >= plan.appelsActifs;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="etiquette">{organisation.pays} · plan {plan.nom}</p>
          <h1 className="titre mt-3 text-4xl">{organisation.nom}</h1>
        </div>
        {quotaAtteint ? (
          <Link href="/tarifs" className="bouton bouton-contour">
            <Lock size={15} aria-hidden /> Passer au plan supérieur
          </Link>
        ) : (
          <FormulaireAppel />
        )}
      </div>

      {quotaAtteint && (
        <p className="mt-6 rounded-xl border border-[var(--gold3)]/40 bg-[var(--gold)]/5 px-4 py-3.5 text-sm leading-relaxed text-[var(--text2)]">
          Le plan <span className="text-[var(--gold)]">{plan.nom}</span> autorise{' '}
          {plan.appelsActifs} appel{plan.appelsActifs > 1 ? 's' : ''} ouvert
          {plan.appelsActifs > 1 ? 's' : ''} à la fois. Fermez un appel en cours, ou passez au plan
          supérieur pour en ouvrir davantage.
        </p>
      )}

      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">
        {[
          { v: appels.length, l: 'appels créés' },
          { v: ouverts, l: 'appels ouverts' },
          { v: totalRecues, l: 'dossiers reçus' },
          { v: totalRetenues, l: 'entreprises retenues' },
        ].map((s) => (
          <div key={s.l} className="bg-[var(--bg2)] px-5 py-5">
            <dt className="mono text-2xl text-[var(--gold)]">{s.v}</dt>
            <dd className="mt-1 text-xs text-[var(--text3)]">{s.l}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12">
        <h2 className="etiquette">Mes appels à candidatures</h2>

        {appels.length === 0 ? (
          <div className="carte mt-6 flex flex-col items-center px-6 py-16 text-center">
            <Inbox size={28} className="text-[var(--text3)]" aria-hidden />
            <p className="mt-5 text-lg font-medium">Aucun appel pour l&rsquo;instant</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text2)]">
              Ouvrez votre premier appel : les porteurs dont le dossier atteint votre score minimum
              pourront candidater, et vous les évaluerez ici sur une grille commune.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {appels.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/programme/appel/${a.id}`}
                  className="carte group flex flex-wrap items-center justify-between gap-5 p-6 transition-colors hover:border-[var(--gold3)]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-medium group-hover:text-[var(--gold)]">
                        {a.titre}
                      </h3>
                      <span
                        className="mono rounded-md px-2 py-0.5 text-[0.625rem] tracking-[0.1em] uppercase"
                        style={
                          a.statut === 'ouvert'
                            ? { color: 'var(--green)', background: 'rgb(34 217 138 / 0.12)' }
                            : { color: 'var(--text3)', background: 'var(--bg3)' }
                        }
                      >
                        {a.statut}
                      </span>
                    </div>
                    <p className="mono mt-1.5 text-xs text-[var(--text3)]">
                      score minimum {a.score_minimum}
                      {a.ferme_le &&
                        ` · clôture le ${new Date(a.ferme_le).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-7">
                    <div className="text-right">
                      <p className="mono text-xl text-[var(--gold)]">{a.recues}</p>
                      <p className="text-[0.625rem] text-[var(--text3)]">reçus</p>
                    </div>
                    <div className="text-right">
                      <p className="mono text-xl text-[var(--green)]">{a.retenues}</p>
                      <p className="text-[0.625rem] text-[var(--text3)]">retenus</p>
                    </div>
                    <ArrowUpRight size={17} className="text-[var(--text3)]" aria-hidden />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
