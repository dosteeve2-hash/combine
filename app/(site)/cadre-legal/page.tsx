import type { Metadata } from 'next';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { brand } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Cadre légal',
  description:
    'Ce que COMBINE fait, ce qu’il ne fait pas, et pourquoi aucun fonds ne transite par la plateforme.',
};

const autorise = [
  'Héberger un dossier et son historique de publication',
  'Horodater chaque publication et en conserver l’historique complet',
  'Partager par invitation un espace privé avec les membres d’une structure',
  'Vendre un abonnement logiciel à un incubateur, un fonds ou une agence',
  'Gérer des appels à candidatures, des évaluations et un suivi de cohorte',
];

const interdit = [
  'Collecter ou détenir les fonds d’un investisseur, même quelques heures',
  'Organiser un placement groupé ou un véhicule d’investissement commun',
  'Présenter des titres financiers comme une offre au public ou promettre un rendement',
  'Conseiller un investisseur sur l’opportunité d’un placement',
  'Prélever une commission sur un financement qui transiterait par la plateforme',
];

export default function CadreLegal() {
  return (
    <>
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto w-full max-w-3xl px-5 pt-16 pb-14">
          <p className="etiquette">Cadre légal</p>
          <h1 className="titre mt-4 text-4xl sm:text-5xl">
            Ce que nous faisons, et ce que nous refusons de faire.
          </h1>
          <p className="mt-6 leading-relaxed text-[var(--text2)]">
            {brand.nom} est un logiciel de préparation et de suivi. Il ne reçoit, ne détient et ne
            transfère aucun fonds, et ne conclut aucune transaction financière. Ces limites décrivent
            le produit; elles ne déterminent pas à elles seules le régime applicable aux opérations
            de ses utilisateurs.
          </p>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-[var(--bg2)]">
        <div className="mx-auto grid w-full max-w-5xl gap-5 px-5 py-16 md:grid-cols-2">
          <div className="carte p-7">
            <ShieldCheck size={22} className="text-[var(--green)]" aria-hidden />
            <h2 className="mt-4 text-lg font-medium">Ce que COMBINE fait</h2>
            <ul className="mt-5 space-y-3">
              {autorise.map((a) => (
                <li key={a} className="text-sm leading-relaxed text-[var(--text2)]">
                  · {a}
                </li>
              ))}
            </ul>
          </div>

          <div className="carte p-7">
            <ShieldX size={22} className="text-[var(--red)]" aria-hidden />
            <h2 className="mt-4 text-lg font-medium">Ce que COMBINE ne fait pas</h2>
            <ul className="mt-5 space-y-3">
              {interdit.map((a) => (
                <li key={a} className="text-sm leading-relaxed text-[var(--text2)]">
                  · {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)]">
        <div className="mx-auto w-full max-w-3xl space-y-12 px-5 py-16">
          <article>
            <h2 className="titre text-2xl">Pourquoi cette ligne</h2>
            <p className="mt-4 leading-relaxed text-[var(--text2)]">
              Le régime d&rsquo;une opération dépend de ses instruments, de ses communications, de ses
              destinataires et des pays concernés. L&rsquo;AMF-UMOA décrit notamment le visa applicable
              aux offres au public de titres financiers. Une invitation nominative, un nombre limité
              de destinataires ou une page en « noindex » ne suffit pas à établir qu&rsquo;une
              opération est exemptée ou conforme.{' '}
              <a
                href="https://www.crepmf.org/accueil/emetteur"
                target="_blank"
                rel="noreferrer"
                className="lien-or"
              >
                Consulter les informations officielles de l&rsquo;AMF-UMOA.
              </a>
            </p>
            <p className="mt-4 leading-relaxed text-[var(--text2)]">
              COMBINE ne reçoit ni ne déplace de fonds. Les utilisateurs restent responsables de
              faire examiner toute opération réelle et les communications qui l&rsquo;entourent par
              un conseil qualifié, dans chaque juridiction concernée, avant de solliciter ou
              d&rsquo;accepter un financement.
            </p>
          </article>

          <article>
            <h2 className="titre text-2xl">Ce que l&rsquo;horodatage prouve — et ce qu&rsquo;il ne prouve pas</h2>
            <p className="mt-4 leading-relaxed text-[var(--text2)]">
              Quand un porteur publie son dossier, nous enregistrons la date et l&rsquo;heure du
              serveur, figeons le contenu et calculons son empreinte. Cette ligne n&rsquo;est jamais
              modifiée ni supprimée : une mise à jour crée une nouvelle publication à côté de
              l&rsquo;ancienne.
            </p>
            <div className="carte mt-6 space-y-4 p-6">
              <div>
                <p className="mono text-xs tracking-[0.1em] text-[var(--green)] uppercase">
                  Ce qui est certifié
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text2)]">
                  Qu&rsquo;un contenu précisément identique a bien été déposé à cette date, et que
                  l&rsquo;historique des dépôts n&rsquo;a pas été réécrit après coup.
                </p>
              </div>
              <div className="border-t border-[var(--border)] pt-4">
                <p className="mono text-xs tracking-[0.1em] text-[var(--gold)] uppercase">
                  Ce qui reste déclaratif
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text2)]">
                  L&rsquo;exactitude des chiffres eux-mêmes. COMBINE ne visite pas les exploitations
                  et n&rsquo;audite pas les comptes. Un financeur doit faire ses propres
                  vérifications — mais il part d&rsquo;un dossier dont il connaît l&rsquo;ancienneté,
                  ce qui n&rsquo;est presque jamais le cas aujourd&rsquo;hui.
                </p>
              </div>
            </div>
          </article>

          <article>
            <h2 className="titre text-2xl">Données personnelles</h2>
            <p className="mt-4 leading-relaxed text-[var(--text2)]">
              Les coordonnées d&rsquo;un porteur ne sont jamais affichées sur la page publique de son
              dossier. Elles ne sont transmises qu&rsquo;aux structures inscrites, et uniquement
              lorsque le porteur candidate à un appel ou qu&rsquo;un financeur marque son intérêt.
              Un porteur peut retirer son dossier du flux public à tout moment ; son historique de
              publication, lui, est conservé, car c&rsquo;est précisément ce qui lui donne de la
              valeur.
            </p>
          </article>

          <article className="border-t border-[var(--border)] pt-10">
            <p className="text-xs leading-relaxed text-[var(--text3)]">
              Cette page décrit le fonctionnement du service et ne constitue pas un avis juridique.
              Une structure qui envisage une opération de financement doit consulter son conseil et,
              le cas échéant, une société de gestion et d&rsquo;intermédiation agréée. Question ou
              signalement : <a href={`mailto:${brand.contactEmail}`} className="lien-or">{brand.contactEmail}</a>.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
