export interface Dossier {
  id: string;
  user_id: string;
  nom: string;
  secteur: string;
  pays: string;
  ville: string | null;
  stade: string;
  resume: string | null;
  probleme: string | null;
  solution: string | null;
  clients: string | null;
  modele: string | null;
  concurrence: string | null;
  equipe_taille: number | null;
  equipe_description: string | null;
  annee_creation: number | null;
  formalise: boolean;
  ca_mensuel_fcfa: string | number | null;
  clients_actifs: number | null;
  croissance_commentaire: string | null;
  besoin_fcfa: string | number | null;
  usage_des_fonds: string | null;
  contrepartie: string | null;
  contact_nom: string | null;
  contact_email: string | null;
  contact_telephone: string | null;
  code_public: string | null;
  publie: boolean;
  cree_le: string;
  maj_le: string;
}

export interface Publication {
  id: string;
  dossier_id: string;
  version: number;
  score: number;
  empreinte: string;
  contenu: Dossier;
  publie_le: string;
}

export interface Organisation {
  id: string;
  nom: string;
  pays: string;
  type: string;
  plan: string;
  plan_expire_le: string | null;
  cree_le: string;
}

export interface Appel {
  id: string;
  organisation_id: string;
  titre: string;
  description: string | null;
  secteurs: string[] | null;
  pays: string[] | null;
  score_minimum: number;
  ferme_le: string | null;
  statut: string;
  cree_le: string;
}

export interface Candidature {
  id: string;
  appel_id: string;
  dossier_id: string;
  statut: string;
  decide_le: string | null;
  cree_le: string;
}

export const CRITERES_EVALUATION = [
  { cle: 'equipe', libelle: 'Équipe', aide: 'Capacité à exécuter, complémentarité, engagement.' },
  { cle: 'probleme', libelle: 'Problème', aide: 'Profondeur du mal traité. Quelqu’un souffre-t-il vraiment ?' },
  { cle: 'traction', libelle: 'Traction', aide: 'Preuves réelles : clients, chiffre d’affaires, usage.' },
  { cle: 'modele', libelle: 'Modèle', aide: 'Le client peut-il payer, et le modèle tient-il ?' },
  { cle: 'impact', libelle: 'Impact', aide: 'Emplois, filière, territoire, effet d’entraînement.' },
] as const;

export type CleCritere = (typeof CRITERES_EVALUATION)[number]['cle'];

export const STATUTS_CANDIDATURE: Record<string, { libelle: string; couleur: string }> = {
  recue: { libelle: 'Reçue', couleur: 'text-[var(--text2)] bg-[var(--bg3)]' },
  en_evaluation: { libelle: 'En évaluation', couleur: 'text-[var(--cyan)] bg-[var(--cyan)]/10' },
  retenue: { libelle: 'Retenue', couleur: 'text-[var(--green)] bg-[var(--green)]/10' },
  ecartee: { libelle: 'Écartée', couleur: 'text-[var(--red)] bg-[var(--red)]/10' },
};
