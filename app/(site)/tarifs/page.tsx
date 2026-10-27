import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import { brand } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Accès au prototype',
  description: 'COMBINE est un prototype privé présenté en démonstration.',
};

export default function AccesPrototype() {
  return (
    <>
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="accueil-status">Prototype privé · en démonstration</p>
          <h1 className="titre mt-6 max-w-4xl text-4xl sm:text-6xl">
            COMBINE se découvre dans un cadre privé.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text2)]">
            Le produit est en développement. L’espace de travail et les dossiers de financement ne
            sont pas proposés sur ces pages publiques.
          </p>
          <a
            href={`mailto:${brand.contactEmail}?subject=${encodeURIComponent('COMBINE — accès au prototype')}`}
            className="bouton bouton-or mt-8"
          >
            Écrire à l’équipe <ArrowUpRight size={16} aria-hidden />
          </a>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <p className="etiquette">Périmètre</p>
            <h2 className="titre mt-3 text-3xl">Un outil de travail, pas une offre financière.</h2>
          </div>
          <div className="space-y-4 text-[var(--text2)] leading-relaxed">
            <p>
              COMBINE aide à structurer un dossier et à en préserver l’historique de publication.
              Aucun fonds n’y transite et aucune transaction n’y est conclue.
            </p>
            <p>
              Les informations d’un dossier sont déclarées par son porteur. Une date et une empreinte
              permettent de vérifier l’historique du dépôt ; elles ne certifient pas la véracité de
              son contenu.
            </p>
            <p>
              Les modalités d’accès à la démonstration se partagent directement, sans formulaire
              public d’intérêt ni affichage de montants.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
