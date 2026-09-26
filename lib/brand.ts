export const brand = {
  nom: 'COMBINE',
  baseline: 'Du prototype au capital.',
  description:
    "COMBINE réunit au même endroit les porteurs de projets africains, les incubateurs qui les accompagnent et les financeurs qui les cherchent.",
  editeur: 'FORGE Afrika',
  auteur: 'Steve Donald Compaoré',
  contactEmail: 'docompaore2@gmail.com',
} as const;

export const PAYS = [
  'Burkina Faso',
  'Côte d’Ivoire',
  'Mali',
  'Sénégal',
  'Niger',
  'Togo',
  'Bénin',
  'Guinée',
  'Ghana',
  'Nigeria',
  'Cameroun',
  'Gabon',
  'Congo',
  'RD Congo',
  'Tchad',
  'Rwanda',
  'Kenya',
  'Ouganda',
  'Tanzanie',
  'Éthiopie',
  'Maroc',
  'Tunisie',
] as const;

export const SECTEURS = [
  'Agriculture',
  'Transformation alimentaire',
  'Logistique & transport',
  'Énergie',
  'Eau & assainissement',
  'Santé',
  'Éducation',
  'Commerce & distribution',
  'Industrie & manufacture',
  'Mines & ressources',
  'Construction',
  'Services financiers',
  'Numérique & logiciel',
  'Artisanat & textile',
  'Déchets & recyclage',
  'Autre',
] as const;

export const STADES = [
  { valeur: 'idee', libelle: 'Idée', aide: 'Le projet est écrit, rien n’est encore construit.' },
  { valeur: 'prototype', libelle: 'Prototype', aide: 'Quelque chose fonctionne, mais personne ne paie encore.' },
  { valeur: 'premiers_clients', libelle: 'Premiers clients', aide: 'Des clients paient, le chiffre d’affaires est petit mais réel.' },
  { valeur: 'croissance', libelle: 'Croissance', aide: 'Le chiffre d’affaires progresse mois après mois.' },
] as const;

export const CONTREPARTIES = [
  { valeur: 'equity', libelle: 'Part au capital' },
  { valeur: 'pret', libelle: 'Prêt remboursable' },
  { valeur: 'subvention', libelle: 'Subvention' },
  { valeur: 'indifferent', libelle: 'Indifférent' },
] as const;

export const TYPES_ORGANISATION = [
  { valeur: 'incubateur', libelle: 'Incubateur / accélérateur' },
  { valeur: 'fonds', libelle: 'Fonds d’investissement' },
  { valeur: 'agence', libelle: 'Agence publique / bailleur' },
  { valeur: 'reseau', libelle: 'Réseau de business angels' },
] as const;

export type Stade = (typeof STADES)[number]['valeur'];
