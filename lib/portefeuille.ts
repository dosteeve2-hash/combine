export const INSTRUMENTS = [
  { valeur: 'equity', libelle: 'Part au capital', aide: 'Vous détenez un pourcentage de la société.' },
  { valeur: 'convertible', libelle: 'Obligation convertible', aide: 'Un prêt qui se transforme en parts au tour suivant.' },
  { valeur: 'pret', libelle: 'Prêt', aide: 'Remboursable, sans prise de participation.' },
  { valeur: 'subvention', libelle: 'Subvention', aide: 'Non remboursable, sans contrepartie au capital.' },
] as const;

export const STATUTS_PARTICIPATION = [
  { valeur: 'active', libelle: 'En portefeuille', couleur: 'var(--green)' },
  { valeur: 'cedee', libelle: 'Cédée', couleur: 'var(--cyan)' },
  { valeur: 'perdue', libelle: 'Perdue', couleur: 'var(--red)' },
] as const;

export interface LignePortefeuille {
  id: string;
  dossier_id: string;
  nom: string;
  pays: string;
  secteur: string;
  code_public: string | null;
  instrument: string;
  montant_fcfa: string;
  pourcentage: string | null;
  valorisation_entree_fcfa: string | null;
  date_entree: string;
  statut: string;
  notes: string | null;
  valeur_actuelle_fcfa: string | null;
  constatee_le: string | null;
  ca_mensuel_fcfa: string | null;
  employes: number | null;
}

export interface Agregats {
  investi: number;
  valeur: number;
  multiple: number | null;
  actives: number;
  cedees: number;
  perdues: number;
  emplois: number;
}

/**
 * La valeur d'une participation, c'est la dernière valorisation constatée — et à défaut
 * le montant investi. On ne fabrique jamais de plus-value par défaut : tant que personne
 * n'a constaté une valeur, la participation vaut ce qu'elle a coûté.
 */
export function valeurDe(l: LignePortefeuille): number {
  if (l.statut === 'perdue') return 0;
  const constatee = l.valeur_actuelle_fcfa === null ? null : Number(l.valeur_actuelle_fcfa);
  if (constatee !== null && Number.isFinite(constatee)) return constatee;
  return Number(l.montant_fcfa) || 0;
}

export function agreger(lignes: LignePortefeuille[]): Agregats {
  const investi = lignes.reduce((s, l) => s + (Number(l.montant_fcfa) || 0), 0);
  const valeur = lignes.reduce((s, l) => s + valeurDe(l), 0);
  return {
    investi,
    valeur,
    multiple: investi > 0 ? valeur / investi : null,
    actives: lignes.filter((l) => l.statut === 'active').length,
    cedees: lignes.filter((l) => l.statut === 'cedee').length,
    perdues: lignes.filter((l) => l.statut === 'perdue').length,
    emplois: lignes.reduce((s, l) => s + (l.employes ?? 0), 0),
  };
}

export function fcfaCourt(montant: number): string {
  if (montant >= 1_000_000_000) return `${(montant / 1_000_000_000).toFixed(1).replace('.0', '')} Md`;
  if (montant >= 1_000_000) return `${(montant / 1_000_000).toFixed(1).replace('.0', '')} M`;
  if (montant >= 1_000) return `${Math.round(montant / 1_000)} k`;
  return String(montant);
}

export const ROLES_MEMBRE = [
  {
    valeur: 'membre',
    libelle: 'Membre de l’équipe',
    aide: 'Voit et gère les appels, les dossiers et le portefeuille.',
  },
  {
    valeur: 'investisseur',
    libelle: 'Investisseur',
    aide: 'Ne voit que le portefeuille, en lecture seule. Aucun accès aux dossiers en cours d’instruction ni aux coordonnées des porteurs.',
  },
] as const;

export const peutGerer = (role: string) => role === 'proprietaire' || role === 'membre';
export const estInvestisseur = (role: string) => role === 'investisseur';
export const investisseurVerifie = (emailVerifie: boolean | undefined, role: string | undefined) =>
  emailVerifie === true && estInvestisseur(role ?? '');
