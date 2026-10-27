import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { IllustrationDossier } from '@/components/illustration-dossier';

const etapes = [
  {
    numero: '01',
    titre: 'Rassembler',
    texte:
      'Le dossier avance par sections. Le porteur sait quelles informations sont déjà réunies et ce qui reste à compléter.',
  },
  {
    numero: '02',
    titre: 'Publier',
    texte:
      'Une publication conserve une version datée du dossier. Les versions suivantes s’ajoutent à l’historique.',
  },
  {
    numero: '03',
    titre: 'Vérifier',
    texte:
      'Un lecteur autorisé peut consulter la date des dépôts et leur empreinte, sans confondre historique et audit.',
  },
] as const;

export default function Accueil() {
  return (
    <>
      <section className="accueil-hero">
        <div className="accueil-hero__inner">
          <div className="accueil-hero__copy">
            <p className="accueil-status">Prototype privé · en démonstration</p>
            <h1 className="titre accueil-hero__title">
              Votre projet, en un dossier qu’un financeur <span>peut vérifier.</span>
            </h1>
            <p className="accueil-hero__intro">
              COMBINE aide à structurer les informations d’un projet, à repérer ce qui manque et à
              garder la trace de ses publications.
            </p>
            <p className="accueil-hero__limite">
              Les informations restent déclaratives : COMBINE horodate les dépôts et préserve leur
              historique, mais n’audite pas les chiffres.
            </p>
            <Link href="/connexion" className="bouton bouton-or accueil-hero__action">
              Accéder à l’espace privé <ArrowRight size={16} aria-hidden />
            </Link>
            <p className="accueil-hero__note">Accès réservé · prototype en développement</p>
          </div>

          <IllustrationDossier />
        </div>
      </section>

      <section id="methode" className="section-produit">
        <p className="etiquette">Le parcours du dossier</p>
        <h2 className="titre section-produit__titre">
          Des informations réunies. Un historique lisible.
        </h2>
        <div className="etapes-produit">
          {etapes.map((etape) => (
            <article key={etape.numero} className="etape-produit">
              <span className="etape-produit__numero">{etape.numero}</span>
              <h3>{etape.titre}</h3>
              <p>{etape.texte}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-produit">
        <p className="etiquette">La limite est volontaire</p>
        <h2 className="titre section-produit__titre">Un historique vérifiable, pas une promesse d’audit.</h2>
        <div className="verifiabilite">
          <article className="verifiabilite__carte verifiabilite__carte--oui">
            <h3>Ce que COMBINE conserve</h3>
            <ul>
              <li>La date de chaque publication, enregistrée par le serveur.</li>
              <li>L’empreinte du contenu publié et l’ordre des versions.</li>
              <li>La possibilité de constater qu’un contenu n’a pas été réécrit après coup.</li>
            </ul>
          </article>
          <article className="verifiabilite__carte verifiabilite__carte--non">
            <h3>Ce que COMBINE ne certifie pas</h3>
            <ul>
              <li>L’exactitude des chiffres ni la réalité des déclarations.</li>
              <li>La qualité comptable, commerciale ou juridique d’un projet.</li>
              <li>Un financement, un partenariat ou un résultat commercial.</li>
            </ul>
          </article>
        </div>
      </section>

      <aside className="statut-prototype" aria-label="Statut du produit">
        <div className="statut-prototype__inner">
          <strong>Un prototype privé, présenté en démonstration.</strong>
          <span>
            Le produit est en développement. Les schémas de cette page illustrent un parcours
            d’interface ; ils ne constituent pas des dossiers ni des preuves.
          </span>
        </div>
      </aside>
    </>
  );
}
