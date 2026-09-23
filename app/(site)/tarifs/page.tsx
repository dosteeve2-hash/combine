import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Infinity as Infini } from 'lucide-react';
import { PLANS, formatFcfa, illimite } from '@/lib/plans';
import { brand } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Tarifs',
  description:
    'COMBINE est gratuit pour les porteurs de projet. Les incubateurs, fonds et agences paient un abonnement mensuel en FCFA.',
};

const questions = [
  {
    q: 'Pourquoi le porteur de projet ne paie-t-il rien ?',
    r: "Parce qu'un entrepreneur qui cherche de l'argent n'en a pas à dépenser pour en chercher. Le faire payer viderait la plateforme de ce qui fait sa valeur : les dossiers. Ce sont les structures dont l'accompagnement est le métier — et le budget — qui financent l'outil.",
  },
  {
    q: 'Comment paie-t-on depuis Ouagadougou ?',
    r: "Orange Money, Moov Money ou virement bancaire. Pour les premiers clients, l'activation est faite à la main par nos soins sous 24 heures ouvrées après réception : vous envoyez la référence de paiement, nous activons le plan. C'est volontairement simple tant que nous sommes peu nombreux.",
  },
  {
    q: 'Que se passe-t-il à la fin de l’abonnement ?',
    r: "Rien n'est supprimé. La structure repasse simplement au plan Essai : les dossiers reçus restent consultables, mais les appels au-delà du premier sont fermés et l'export bailleur n'est plus accessible jusqu'au renouvellement.",
  },
  {
    q: 'Est-ce que COMBINE prend une commission sur les financements ?',
    r: "Non. COMBINE vend un logiciel, pas un service d'intermédiation financière. Aucun fonds ne transite par la plateforme et aucun placement n'y est proposé — c'est une limite volontaire, expliquée en détail sur la page Cadre légal.",
  },
];

export default function Tarifs() {
  return (
    <>
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto w-full max-w-6xl px-5 pt-16 pb-14">
          <p className="etiquette">Tarifs</p>
          <h1 className="titre mt-4 max-w-3xl text-4xl sm:text-5xl">
            Gratuit pour ceux qui cherchent. Payant pour ceux qui accompagnent.
          </h1>
          <p className="mt-6 max-w-2xl leading-relaxed text-[var(--text2)]">
            Prix en francs CFA, sans engagement de durée. L&rsquo;équivalent en dollars est indicatif
            et sert aux bailleurs qui budgètent en devise.
          </p>
        </div>
      </section>

      <section className="border-b border-[var(--border)]">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-16 lg:grid-cols-3">
          {Object.values(PLANS).map((plan) => {
            const vedette = plan.code === 'programme';
            return (
              <div
                key={plan.code}
                className="carte relative flex flex-col p-7"
                style={vedette ? { borderColor: 'var(--gold3)', background: 'var(--bg3)' } : undefined}
              >
                {vedette && (
                  <span className="mono absolute -top-2.5 left-7 rounded-md bg-[var(--gold)] px-2.5 py-1 text-[0.625rem] tracking-[0.12em] text-[var(--bg)] uppercase">
                    Le plus courant
                  </span>
                )}

                <p className="etiquette">{plan.nom}</p>
                <p className="mt-2 min-h-10 text-sm leading-snug text-[var(--text2)]">{plan.pour}</p>

                <div className="mt-6 border-t border-[var(--border)] pt-6">
                  <p className="mono text-3xl font-medium text-[var(--gold)]">
                    {plan.prixMensuelFcfa === 0 ? 'Gratuit' : formatFcfa(plan.prixMensuelFcfa)}
                  </p>
                  <p className="mt-1.5 text-xs text-[var(--text3)]">
                    {plan.prixMensuelFcfa === 0 ? (
                      'sans limite de durée'
                    ) : (
                      <>
                        par mois · environ {plan.prixMensuelUsd} USD
                        <br />
                        {formatFcfa(plan.prixAnnuelFcfa)} par an (deux mois offerts)
                      </>
                    )}
                  </p>
                </div>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.avantages.map((a) => (
                    <li key={a} className="flex gap-2.5 text-sm text-[var(--text2)]">
                      <Check size={15} className="mt-0.5 shrink-0 text-[var(--green)]" aria-hidden />
                      {a}
                    </li>
                  ))}
                </ul>

                <dl className="mono mt-6 space-y-1.5 border-t border-[var(--border)] pt-5 text-xs text-[var(--text3)]">
                  {[
                    ['Appels ouverts', plan.appelsActifs],
                    ['Dossiers / appel', plan.candidaturesParAppel],
                    ['Membres', plan.membres],
                  ].map(([libelle, valeur]) => (
                    <div key={String(libelle)} className="flex justify-between gap-3">
                      <dt>{libelle}</dt>
                      <dd className="text-[var(--text2)]">
                        {illimite(Number(valeur)) ? (
                          <Infini size={13} className="inline" aria-label="illimité" />
                        ) : (
                          String(valeur)
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>

                <Link
                  href={plan.code === 'essai' ? '/inscription' : `/programme/creer?plan=${plan.code}`}
                  className={`bouton mt-7 w-full ${vedette ? 'bouton-or' : 'bouton-contour'}`}
                >
                  {plan.code === 'essai' ? 'Créer un compte' : 'Demander l’activation'}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-[var(--bg2)]">
        <div className="mx-auto w-full max-w-3xl px-5 py-16">
          <h2 className="titre text-2xl sm:text-3xl">Les questions qu&rsquo;on nous pose</h2>
          <dl className="mt-10 space-y-8">
            {questions.map((item) => (
              <div key={item.q}>
                <dt className="font-medium text-[var(--text)]">{item.q}</dt>
                <dd className="mt-2.5 text-sm leading-relaxed text-[var(--text2)]">{item.r}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-3xl px-5 py-16 text-center">
          <h2 className="titre text-2xl sm:text-3xl">Un doute sur le plan qu&rsquo;il vous faut ?</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[var(--text2)]">
            Écrivez-nous en deux lignes : combien de dossiers vous recevez par an et combien vous
            êtes à les lire. La réponse est souvent « le plan Essai suffit pour l&rsquo;instant ».
          </p>
          <a
            href={`mailto:${brand.contactEmail}?subject=${encodeURIComponent('COMBINE — quel plan pour ma structure ?')}`}
            className="bouton bouton-contour mx-auto mt-7"
          >
            Nous écrire <ArrowRight size={15} aria-hidden />
          </a>
        </div>
      </section>
    </>
  );
}
