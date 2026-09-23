import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileCheck2, Layers, ShieldCheck, Users } from 'lucide-react';
import { brand } from '@/lib/brand';
import { PLANS, formatFcfa } from '@/lib/plans';
import { sql } from '@/lib/db';

export const revalidate = 60;

async function chiffres() {
  try {
    const lignes = (await sql`
      select
        (select count(*) from dossier where publie)          as dossiers,
        (select count(*) from publication)                   as publications,
        (select count(*) from appel where statut = 'ouvert') as appels
    `) as { dossiers: string; publications: string; appels: string }[];
    const d = lignes[0];
    return {
      dossiers: Number(d?.dossiers ?? 0),
      publications: Number(d?.publications ?? 0),
      appels: Number(d?.appels ?? 0),
    };
  } catch {
    return { dossiers: 0, publications: 0, appels: 0 };
  }
}

const portes = [
  {
    icone: FileCheck2,
    etiquette: 'Porteur de projet',
    titre: 'Montez le dossier qu’on vous réclame',
    texte:
      'Vous avez un produit qui marche, mais chaque financeur demande un dossier différent. COMBINE en fait un seul, structuré, et vous dit exactement ce qui lui manque pour être pris au sérieux.',
    points: [
      'Un formulaire par étapes, qui tient sur un téléphone',
      'Un score de préparation qui nomme ce qui manque',
      'Un lien public que le financeur ouvre lui-même',
    ],
    lien: { href: '/inscription', libelle: 'Déposer mon projet' },
    accent: 'var(--gold)',
  },
  {
    icone: Layers,
    etiquette: 'Incubateur, fonds, agence',
    titre: 'Pilotez vos cohortes, sortez votre rapport',
    texte:
      'Vos appels à candidatures vivent dans un formulaire, vos évaluations dans un tableur, vos échanges dans WhatsApp. Le jour du rapport bailleur, vous y passez la semaine. COMBINE réunit les trois.',
    points: [
      'Appels à candidatures avec critères d’éligibilité',
      'Grille d’évaluation partagée entre les membres',
      'Suivi de cohorte et export du rapport bailleur',
    ],
    lien: { href: '/tarifs', libelle: 'Voir les tarifs' },
    accent: 'var(--cyan)',
  },
  {
    icone: Users,
    etiquette: 'Financeur',
    titre: 'Voyez des dossiers déjà instruits',
    texte:
      'Vous ne manquez pas de projets, vous manquez de dossiers lisibles. Ici chaque dossier est daté, figé, et son historique de publication est incontestable. Vous faites votre propre analyse.',
    points: [
      'Filtres par pays, secteur, stade et préparation',
      'Historique de publication horodaté par le serveur',
      'Mise en relation directe, sans intermédiaire',
    ],
    lien: { href: '/flux', libelle: 'Parcourir les dossiers' },
    accent: 'var(--green)',
  },
] as const;

export default async function Accueil() {
  const c = await chiffres();

  return (
    <>
        {/* ------------------------------------------------------------- hero */}
        <section className="relative overflow-hidden border-b border-[var(--border)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
            style={{ background: 'radial-gradient(circle, var(--gold3), transparent 65%)' }}
          />
          <div className="relative mx-auto w-full max-w-6xl px-5 pt-20 pb-24 sm:pt-28 sm:pb-32">
            <p className="etiquette apparait">
              {brand.editeur} · Afrique de l&rsquo;Ouest et centrale
            </p>

            <h1
              className="titre apparait mt-5 max-w-4xl text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl"
              style={{ animationDelay: '60ms' }}
            >
              Du prototype
              <br />
              <span className="text-[var(--gold)]">au capital.</span>
            </h1>

            <p
              className="apparait mt-7 max-w-2xl text-lg leading-relaxed text-[var(--text2)]"
              style={{ animationDelay: '120ms' }}
            >
              Des milliers de projets africains fonctionnent déjà et ne trouvent pourtant pas un
              franc. Ce n&rsquo;est presque jamais la qualité qui bloque — c&rsquo;est
              l&rsquo;absence d&rsquo;un dossier qu&rsquo;un financeur puisse ouvrir, comprendre et
              vérifier. <span className="text-[var(--text)]">COMBINE construit ce dossier</span>,
              puis met les trois parties autour.
            </p>

            <div
              className="apparait mt-10 flex flex-wrap items-center gap-3"
              style={{ animationDelay: '180ms' }}
            >
              <Link href="/inscription" className="bouton bouton-or px-6 py-3 text-[0.9375rem]">
                Déposer mon projet
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href="/flux" className="bouton bouton-contour px-6 py-3 text-[0.9375rem]">
                Parcourir les dossiers
              </Link>
            </div>

            <dl
              className="apparait mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-[var(--border)] pt-8"
              style={{ animationDelay: '240ms' }}
            >
              {[
                { v: c.dossiers, l: 'dossiers publiés' },
                { v: c.publications, l: 'publications horodatées' },
                { v: c.appels, l: 'appels à candidatures ouverts' },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="mono text-3xl font-medium text-[var(--gold)]">{s.v}</dt>
                  <dd className="mt-1.5 text-xs leading-snug text-[var(--text3)]">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* --------------------------------------------------------- le constat */}
        <section className="border-b border-[var(--border)] bg-[var(--bg2)]">
          <div className="mx-auto w-full max-w-6xl px-5 py-20">
            <p className="etiquette">Le constat</p>
            <h2 className="titre mt-4 max-w-3xl text-3xl sm:text-4xl">
              L&rsquo;argent existe. Le chemin vers l&rsquo;argent, non.
            </h2>
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {[
                {
                  n: '01',
                  t: 'Le porteur ne sait pas ce qu’on attend de lui',
                  d: 'Il a un prototype qui tourne et des clients. On lui demande un « business plan » — un document dont personne ne lui a montré le contenu attendu. Il abandonne, ou il paie quelqu’un pour écrire ce qu’il ne maîtrise pas.',
                },
                {
                  n: '02',
                  t: 'L’incubateur travaille à la main',
                  d: 'Candidatures dans un formulaire, notes dans un tableur, échanges dans WhatsApp, rapport bailleur reconstitué à la main chaque trimestre. Le temps passé à rendre compte est du temps volé à l’accompagnement.',
                },
                {
                  n: '03',
                  t: 'Le financeur ne peut rien vérifier',
                  d: 'Les chiffres qu’on lui présente ont été écrits la veille du rendez-vous. Rien ne prouve qu’ils existaient un mois plus tôt. Sans historique, pas de confiance — et sans confiance, pas de financement.',
                },
              ].map((b) => (
                <article key={b.n}>
                  <span className="mono text-sm text-[var(--gold3)]">{b.n}</span>
                  <h3 className="mt-3 text-lg leading-snug font-medium text-[var(--text)]">{b.t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text2)]">{b.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- les portes */}
        <section className="border-b border-[var(--border)]">
          <div className="mx-auto w-full max-w-6xl px-5 py-20">
            <p className="etiquette">Trois portes, une seule table</p>
            <h2 className="titre mt-4 max-w-3xl text-3xl sm:text-4xl">
              Chacun entre par où il vient. Tout le monde se retrouve sur le même dossier.
            </h2>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {portes.map((p) => (
                <article
                  key={p.etiquette}
                  className="carte flex flex-col p-7 transition-colors hover:border-[var(--border2)]"
                >
                  <p.icone size={22} style={{ color: p.accent }} aria-hidden />
                  <p className="etiquette mt-5" style={{ color: p.accent }}>
                    {p.etiquette}
                  </p>
                  <h3 className="mt-2.5 text-xl leading-snug font-medium">{p.titre}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text2)]">{p.texte}</p>
                  <ul className="mt-6 space-y-2.5">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex gap-2.5 text-sm text-[var(--text2)]">
                        <CheckCircle2
                          size={15}
                          className="mt-0.5 shrink-0"
                          style={{ color: p.accent }}
                          aria-hidden
                        />
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={p.lien.href}
                    className="lien-or mono mt-7 inline-flex items-center gap-1.5 text-xs tracking-[0.1em] uppercase"
                  >
                    {p.lien.libelle} <ArrowRight size={13} aria-hidden />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- dossier vérifiable */}
        <section className="border-b border-[var(--border)] bg-[var(--bg2)]">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="etiquette">Ce qui nous distingue</p>
              <h2 className="titre mt-4 text-3xl sm:text-4xl">
                Un dossier qu&rsquo;on peut <span className="text-[var(--gold)]">vérifier</span>, pas
                seulement lire.
              </h2>
              <p className="mt-6 leading-relaxed text-[var(--text2)]">
                Quand vous publiez votre dossier, COMBINE en fige le contenu, l&rsquo;horodate avec
                l&rsquo;heure du serveur et calcule son empreinte. La publication suivante
                n&rsquo;efface pas la précédente : elle s&rsquo;ajoute.
              </p>
              <p className="mt-4 leading-relaxed text-[var(--text2)]">
                Un financeur qui ouvre votre lien public ne voit donc pas seulement vos chiffres. Il
                voit <span className="text-[var(--text)]">depuis quand vous les tenez</span>.
                C&rsquo;est la différence entre une affirmation et une preuve — et c&rsquo;est ce qui
                manque à tous les dossiers rédigés la veille du rendez-vous.
              </p>
              <Link
                href="/cadre-legal"
                className="lien-or mt-7 inline-flex items-center gap-1.5 text-sm"
              >
                Comment ça marche, et ce que ça ne prouve pas <ArrowRight size={14} aria-hidden />
              </Link>
            </div>

            <div className="carte overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg3)] px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--red)]/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--green)]/60" />
                <span className="mono ml-2 truncate text-xs text-[var(--text3)]">
                  /dossier/K7M2-P9XQ
                </span>
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-medium">Ferme avicole Tanguy</p>
                    <p className="mono mt-0.5 text-xs text-[var(--text3)]">
                      Bobo-Dioulasso · Burkina Faso
                    </p>
                  </div>
                  <span className="mono rounded-lg bg-[var(--green)]/10 px-2.5 py-1 text-xs text-[var(--green)]">
                    82 / 100
                  </span>
                </div>
                <div className="space-y-2 border-t border-[var(--border)] pt-4">
                  {[
                    ['Publication n° 5', '12 septembre 2026'],
                    ['Publication n° 4', '04 août 2026'],
                    ['Publication n° 3', '19 juin 2026'],
                  ].map(([v, d]) => (
                    <div key={v} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-[var(--text2)]">
                        <ShieldCheck size={14} className="text-[var(--green)]" aria-hidden />
                        {v}
                      </span>
                      <span className="mono text-xs text-[var(--text3)]">{d}</span>
                    </div>
                  ))}
                </div>
                <p className="border-t border-[var(--border)] pt-4 text-xs leading-relaxed text-[var(--text3)]">
                  5 publications depuis le 19 juin 2026. Le contenu est déclaré par le porteur ;
                  c&rsquo;est l&rsquo;historique des dépôts qui est certifié par COMBINE.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- tarifs */}
        <section>
          <div className="mx-auto w-full max-w-6xl px-5 py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="etiquette">Le modèle</p>
                <h2 className="titre mt-4 max-w-2xl text-3xl sm:text-4xl">
                  Gratuit pour les porteurs. Payant pour ceux qui en vivent.
                </h2>
              </div>
              <Link href="/tarifs" className="bouton bouton-contour">
                Tous les détails <ArrowRight size={15} aria-hidden />
              </Link>
            </div>

            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[var(--text2)]">
              Un entrepreneur qui cherche de l&rsquo;argent ne paie pas pour en chercher. Ce sont les
              incubateurs, les fonds et les agences — ceux dont c&rsquo;est le métier et le budget —
              qui financent l&rsquo;outil.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-3">
              {Object.values(PLANS).map((plan) => (
                <div
                  key={plan.code}
                  className="carte p-6"
                  style={
                    plan.code === 'programme'
                      ? { borderColor: 'var(--gold3)', background: 'var(--bg3)' }
                      : undefined
                  }
                >
                  <p className="etiquette">{plan.nom}</p>
                  <p className="mono mt-3 text-2xl text-[var(--gold)]">
                    {plan.prixMensuelFcfa === 0 ? 'Gratuit' : formatFcfa(plan.prixMensuelFcfa)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text3)]">
                    {plan.prixMensuelFcfa === 0 ? 'sans limite de durée' : 'par mois'}
                  </p>
                  <p className="mt-4 text-sm text-[var(--text2)]">{plan.pour}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- cta */}
        <section className="border-y border-[var(--border)] bg-[var(--bg2)]">
          <div className="mx-auto w-full max-w-3xl px-5 py-20 text-center">
            <h2 className="titre text-3xl sm:text-4xl">
              Votre projet mérite mieux qu&rsquo;un message WhatsApp.
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-[var(--text2)]">
              Comptez vingt minutes pour monter un premier dossier. Vous saurez immédiatement ce
              qu&rsquo;il lui manque pour être publiable.
            </p>
            <Link
              href="/inscription"
              className="bouton bouton-or mx-auto mt-9 px-7 py-3 text-[0.9375rem]"
            >
              Commencer — c&rsquo;est gratuit
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </section>
    </>
  );
}
