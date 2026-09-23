import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, ExternalLink, Lock, ShieldCheck } from 'lucide-react';
import { sql } from '@/lib/db';
import { exigerOrganisation, exigerUtilisateur } from '@/lib/session';
import {
  agreger,
  estInvestisseur,
  fcfaCourt,
  peutGerer,
  valeurDe,
  INSTRUMENTS,
  STATUTS_PARTICIPATION,
  type LignePortefeuille,
} from '@/lib/portefeuille';
import { formatFcfa } from '@/lib/plans';
import {
  BoutonRevoquer,
  BoutonsStatutParticipation,
  FormulaireInvitation,
  FormulaireParticipation,
  FormulaireValorisation,
} from '@/components/formulaires-portefeuille';

export const metadata: Metadata = {
  title: 'Portefeuille',
  // L’espace portefeuille contient des informations privées sur les structures et leurs membres.
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

const libelleInstrument = (v: string) => INSTRUMENTS.find((i) => i.valeur === v)?.libelle ?? v;
const couleurStatut = (v: string) =>
  STATUTS_PARTICIPATION.find((s) => s.valeur === v)?.couleur ?? 'var(--text3)';
const libelleStatut = (v: string) =>
  STATUTS_PARTICIPATION.find((s) => s.valeur === v)?.libelle ?? v;

export default async function Portefeuille() {
  const utilisateur = await exigerUtilisateur();
  const { organisation, role, plan } = await exigerOrganisation(utilisateur.id);
  const gestionnaire = peutGerer(role);

  const lignes = (await sql`
    select p.id, p.dossier_id, d.nom, d.pays, d.secteur, d.code_public,
           p.instrument, p.montant_fcfa::text, p.pourcentage::text,
           p.valorisation_entree_fcfa::text, p.date_entree::text, p.statut, p.notes,
           v.valeur_fcfa::text     as valeur_actuelle_fcfa,
           v.constatee_le::text    as constatee_le,
           v.ca_mensuel_fcfa::text as ca_mensuel_fcfa,
           v.employes
      from participation p
      join dossier d on d.id = p.dossier_id
      left join lateral (
        select valeur_fcfa, constatee_le, ca_mensuel_fcfa, employes
          from valorisation where participation_id = p.id
         order by constatee_le desc, cree_le desc limit 1
      ) v on true
     where p.organisation_id = ${organisation.id}
     order by p.date_entree desc
  `) as LignePortefeuille[];

  const a = agreger(lignes);

  // Entreprises éligibles : dossier publié, pas déjà en portefeuille.
  const candidats = gestionnaire
    ? ((await sql`
        select d.id, d.nom, d.pays from dossier d
         where d.publie
           and d.id not in (select dossier_id from participation where organisation_id = ${organisation.id})
         order by d.maj_le desc limit 100
      `) as { id: string; nom: string; pays: string }[])
    : [];

  const membres = gestionnaire
    ? ((await sql`
        select m.id, m.role, u."name" as nom, u."email" as email
          from membre m join "user" u on u."id" = m.user_id
         where m.organisation_id = ${organisation.id}
         order by m.cree_le asc
      `) as { id: string; role: string; nom: string; email: string }[])
    : [];

  const invitations = gestionnaire
    ? ((await sql`
        select id, email, role, code, expire_le::text from invitation
         where organisation_id = ${organisation.id} and acceptee_le is null and expire_le > now()
         order by cree_le desc
      `) as { id: string; email: string; role: string; code: string; expire_le: string }[])
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="etiquette">
            {organisation.nom} · {estInvestisseur(role) ? 'accès investisseur' : `plan ${plan.nom}`}
          </p>
          <h1 className="titre mt-3 text-4xl">Portefeuille</h1>
          {estInvestisseur(role) && (
            <p className="mt-3 flex items-center gap-2 text-sm text-[var(--text2)]">
              <Lock size={14} className="text-[var(--gold)]" aria-hidden />
              Lecture seule. Les dossiers en cours d&rsquo;instruction et les coordonnées des
              porteurs ne vous sont pas accessibles.
            </p>
          )}
        </div>
        {gestionnaire && <FormulaireParticipation candidats={candidats} />}
      </header>

      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-4">
        {[
          { v: `${fcfaCourt(a.investi)} F`, l: 'engagé au total' },
          { v: `${fcfaCourt(a.valeur)} F`, l: 'valeur constatée' },
          { v: a.multiple === null ? '—' : `${a.multiple.toFixed(2)}×`, l: 'multiple' },
          { v: `${a.actives}`, l: `en portefeuille · ${a.emplois} emplois` },
        ].map((s) => (
          <div key={s.l} className="bg-[var(--bg2)] px-5 py-5">
            <dt className="mono text-2xl text-[var(--gold)]">{s.v}</dt>
            <dd className="mt-1 text-xs leading-snug text-[var(--text3)]">{s.l}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-[var(--text3)]">
        La valeur d&rsquo;une participation est sa dernière valorisation constatée. Tant que
        personne n&rsquo;en a constaté une, elle vaut ce qu&rsquo;elle a coûté — aucune plus-value
        n&rsquo;est supposée. Une participation perdue vaut zéro.
      </p>

      <section className="mt-12 space-y-4">
        <h2 className="etiquette">Les participations</h2>

        {lignes.length === 0 ? (
          <div className="carte flex flex-col items-center px-6 py-16 text-center">
            <Briefcase size={28} className="text-[var(--text3)]" aria-hidden />
            <p className="mt-5 text-lg font-medium">Portefeuille vide</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text2)]">
              {gestionnaire
                ? 'Une participation ne se prend que dans une entreprise dont le dossier est publié : c’est ce qui date et fige ce sur quoi vous avez investi.'
                : 'Aucune participation n’a encore été enregistrée.'}
            </p>
          </div>
        ) : (
          lignes.map((l) => {
            const valeur = valeurDe(l);
            const investi = Number(l.montant_fcfa) || 0;
            const multiple = investi > 0 ? valeur / investi : null;

            return (
              <article key={l.id} className="carte p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-medium">{l.nom}</h3>
                      <span
                        className="mono rounded-md px-2 py-0.5 text-[0.625rem] tracking-[0.1em] uppercase"
                        style={{
                          color: couleurStatut(l.statut),
                          background: `${couleurStatut(l.statut)}14`,
                        }}
                      >
                        {libelleStatut(l.statut)}
                      </span>
                    </div>
                    <p className="mono mt-1.5 text-xs text-[var(--text3)]">
                      {[l.pays, l.secteur].filter(Boolean).join(' · ')} ·{' '}
                      {libelleInstrument(l.instrument)}
                      {l.pourcentage && ` · ${Number(l.pourcentage)} %`} · entrée le{' '}
                      {new Date(l.date_entree).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-start gap-7">
                    <div className="text-right">
                      <p className="mono text-lg text-[var(--text2)]">{fcfaCourt(investi)} F</p>
                      <p className="text-[0.625rem] text-[var(--text3)]">engagé</p>
                    </div>
                    <div className="text-right">
                      <p className="mono text-lg text-[var(--gold)]">{fcfaCourt(valeur)} F</p>
                      <p className="text-[0.625rem] text-[var(--text3)]">
                        {l.constatee_le
                          ? `constaté le ${new Date(l.constatee_le).toLocaleDateString('fr-FR')}`
                          : 'non valorisé'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="mono text-lg"
                        style={{
                          color:
                            multiple === null
                              ? 'var(--text3)'
                              : multiple >= 1
                                ? 'var(--green)'
                                : 'var(--red)',
                        }}
                      >
                        {multiple === null ? '—' : `${multiple.toFixed(2)}×`}
                      </p>
                      <p className="text-[0.625rem] text-[var(--text3)]">multiple</p>
                    </div>
                  </div>
                </div>

                {(l.ca_mensuel_fcfa || l.employes) && (
                  <p className="mono mt-4 flex flex-wrap gap-4 border-t border-[var(--border)] pt-4 text-xs text-[var(--text3)]">
                    {l.ca_mensuel_fcfa && (
                      <span>CA {formatFcfa(Number(l.ca_mensuel_fcfa))}/mois</span>
                    )}
                    {l.employes !== null && <span>{l.employes} employés</span>}
                  </p>
                )}

                {gestionnaire && l.notes && (
                  <p className="mt-4 rounded-xl bg-[var(--bg3)] px-4 py-3 text-sm leading-relaxed text-[var(--text2)]">
                    {l.notes}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-5">
                  {l.code_public && (
                    <Link
                      href={`/dossier/${l.code_public}`}
                      className="lien-or mono inline-flex items-center gap-1.5 text-xs"
                    >
                      dossier vérifiable <ExternalLink size={11} aria-hidden />
                    </Link>
                  )}
                  {gestionnaire && (
                    <>
                      <span className="flex-1" />
                      <BoutonsStatutParticipation id={l.id} statut={l.statut} />
                    </>
                  )}
                </div>

                {gestionnaire && <FormulaireValorisation participationId={l.id} />}
              </article>
            );
          })
        )}
      </section>

      {gestionnaire && (
        <section className="mt-14">
          <h2 className="etiquette">Qui a accès</h2>

          <div className="carte mt-5 p-7">
            <ul className="space-y-3">
              {membres.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{m.nom}</p>
                    <p className="mono text-xs text-[var(--text3)]">{m.email}</p>
                  </div>
                  <span className="mono rounded-md bg-[var(--bg3)] px-2 py-1 text-[0.625rem] tracking-[0.1em] text-[var(--text2)] uppercase">
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>

            {invitations.length > 0 && (
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <p className="etiquette mb-3">Invitations en attente</p>
                <ul className="space-y-2.5">
                  {invitations.map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="mono text-sm text-[var(--text2)]">{i.email}</p>
                        <p className="mono text-xs text-[var(--text3)]">
                          {i.role} · /invitation/{i.code} · expire le{' '}
                          {new Date(i.expire_le).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <BoutonRevoquer id={i.id} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {role === 'proprietaire' && (
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <p className="etiquette mb-3">Inviter quelqu&rsquo;un</p>
                <FormulaireInvitation />
              </div>
            )}
          </div>

          <div className="carte mt-4 flex gap-4 p-6">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-[var(--green)]" aria-hidden />
            <div>
              <p className="text-sm font-medium">Pourquoi l&rsquo;accès est nominatif</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text2)]">
                L&rsquo;accès à cette vue est limité aux membres de votre structure. Une invitation
                et une page non indexée ne déterminent pas le régime juridique d&rsquo;une opération.
                Avant tout financement réel, faites vérifier les titres, les communications et les
                pays concernés par un conseil qualifié.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
