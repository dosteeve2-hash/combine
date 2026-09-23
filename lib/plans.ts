/**
 * Les plans COMBINE.
 *
 * Décision du 22/09/2026 (test de vendabilité) : le revenu vient de l'abonnement des
 * organisations — incubateurs, fonds, agences. Le porteur de projet ne paie jamais :
 * c'est lui qui apporte la matière première, le faire payer viderait la plateforme.
 *
 * COMBINE ne traite aucun flux de financement entre porteurs et investisseurs.
 * L'encaissement est manuel pour les premiers clients : `npm run plan:activer`.
 */

export type CodePlan = 'essai' | 'programme' | 'institution';

export interface Plan {
  code: CodePlan;
  nom: string;
  pour: string;
  prixMensuelFcfa: number;
  prixAnnuelFcfa: number;
  prixMensuelUsd: number;
  appelsActifs: number;
  candidaturesParAppel: number;
  membres: number;
  exportBailleur: boolean;
  avantages: string[];
}

export const PLANS: Record<CodePlan, Plan> = {
  essai: {
    code: 'essai',
    nom: 'Essai',
    pour: 'Pour voir si l’outil vous va',
    prixMensuelFcfa: 0,
    prixAnnuelFcfa: 0,
    prixMensuelUsd: 0,
    appelsActifs: 1,
    candidaturesParAppel: 10,
    membres: 2,
    exportBailleur: false,
    avantages: [
      '1 appel à candidatures',
      '10 dossiers reçus',
      '2 membres dans l’équipe',
      'Grille d’évaluation complète',
    ],
  },
  programme: {
    code: 'programme',
    nom: 'Programme',
    pour: 'Un incubateur, un accélérateur, une cohorte',
    prixMensuelFcfa: 45_000,
    prixAnnuelFcfa: 450_000,
    prixMensuelUsd: 75,
    appelsActifs: 3,
    candidaturesParAppel: 40,
    membres: 5,
    exportBailleur: true,
    avantages: [
      '3 appels à candidatures simultanés',
      '40 dossiers par appel',
      '5 membres dans l’équipe',
      'Export du rapport bailleur',
      'Suivi de cohorte',
    ],
  },
  institution: {
    code: 'institution',
    nom: 'Institution',
    pour: 'Un fonds, un réseau, une agence, plusieurs pays',
    prixMensuelFcfa: 150_000,
    prixAnnuelFcfa: 1_500_000,
    prixMensuelUsd: 250,
    appelsActifs: Number.MAX_SAFE_INTEGER,
    candidaturesParAppel: Number.MAX_SAFE_INTEGER,
    membres: Number.MAX_SAFE_INTEGER,
    exportBailleur: true,
    avantages: [
      'Appels et dossiers illimités',
      'Équipe illimitée',
      'Export du rapport bailleur',
      'Suivi multi-pays et multi-programmes',
      'Accompagnement à la mise en route',
    ],
  },
};

/** Un porteur de projet, sur le plan gratuit, tient un seul dossier. */
export const DOSSIERS_GRATUITS = 1;

/** Score minimum pour qu'un dossier puisse être publié. En dessous, il n'est pas lisible. */
export const SCORE_PUBLICATION = 60;

export const illimite = (n: number) => n >= Number.MAX_SAFE_INTEGER;

export function formatFcfa(montant: number): string {
  return `${montant.toLocaleString('fr-FR')} FCFA`;
}

export function planActif(code: string | null, expireLe: Date | string | null): Plan {
  const plan = PLANS[(code ?? 'essai') as CodePlan] ?? PLANS.essai;
  if (plan.code === 'essai') return plan;
  if (!expireLe) return PLANS.essai;
  const fin = typeof expireLe === 'string' ? new Date(expireLe) : expireLe;
  return fin.getTime() > Date.now() ? plan : PLANS.essai;
}
