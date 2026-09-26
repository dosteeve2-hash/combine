import type { Dossier } from './types';

/**
 * Le score de préparation.
 *
 * Il ne juge pas la qualité du projet — personne ne peut faire ça avec une formule.
 * Il mesure une seule chose : est-ce qu'un financeur qui ouvre ce dossier y trouve
 * de quoi décider ? Chaque point manquant est nommé, pour que le porteur sache
 * exactement quoi faire ensuite. C'est ça, la différence avec un formulaire.
 */

export interface Critere {
  cle: string;
  libelle: string;
  points: number;
  obtenus: number;
  manques: string[];
}

const rempli = (v: unknown, min = 1): boolean =>
  typeof v === 'string' ? v.trim().length >= min : v !== null && v !== undefined && v !== '';

const nombreRempli = (v: unknown): boolean => {
  if (v === null || v === undefined || v === '') return false;
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) && n > 0;
};

export function calculerScore(d: Partial<Dossier>): {
  total: number;
  criteres: Critere[];
  manquesPrioritaires: string[];
} {
  const criteres: Critere[] = [];

  // 1. Identité — 15
  {
    const manques: string[] = [];
    let p = 0;
    if (rempli(d.nom, 2)) p += 4;
    else manques.push('le nom du projet');
    if (rempli(d.secteur)) p += 3;
    else manques.push('le secteur');
    if (rempli(d.pays)) p += 2;
    else manques.push('le pays');
    if (rempli(d.stade)) p += 2;
    else manques.push('le stade d’avancement');
    if (rempli(d.resume, 40)) p += 4;
    else manques.push('un résumé d’au moins 40 caractères — la phrase qu’un financeur lira en premier');
    criteres.push({ cle: 'identite', libelle: 'Identité du projet', points: 15, obtenus: p, manques });
  }

  // 2. Problème & solution — 20
  {
    const manques: string[] = [];
    let p = 0;
    if (rempli(d.probleme, 80)) p += 8;
    else manques.push('le problème traité, décrit en 80 caractères minimum');
    if (rempli(d.solution, 80)) p += 7;
    else manques.push('votre solution, décrite en 80 caractères minimum');
    if (rempli(d.clients, 30)) p += 5;
    else manques.push('qui exactement est votre client — un rôle, pas un secteur');
    criteres.push({ cle: 'probleme', libelle: 'Problème & solution', points: 20, obtenus: p, manques });
  }

  // 3. Preuve & traction — 25. Le cœur : c'est ce que personne ne remplit, et c'est ce qui décide.
  {
    const manques: string[] = [];
    let p = 0;
    if (nombreRempli(d.ca_mensuel_fcfa)) p += 10;
    else manques.push('votre chiffre d’affaires mensuel, même petit, même irrégulier');
    if (nombreRempli(d.clients_actifs)) p += 7;
    else manques.push('le nombre de clients ou d’utilisateurs actifs');
    if (rempli(d.croissance_commentaire, 40)) p += 5;
    else manques.push('comment ces chiffres ont évolué sur les derniers mois');
    if (nombreRempli(d.annee_creation)) p += 3;
    else manques.push('l’année de démarrage du projet');
    criteres.push({ cle: 'traction', libelle: 'Preuve & traction', points: 25, obtenus: p, manques });
  }

  // 4. Équipe — 15
  {
    const manques: string[] = [];
    let p = 0;
    if (nombreRempli(d.equipe_taille)) p += 5;
    else manques.push('la taille de l’équipe');
    if (rempli(d.equipe_description, 60)) p += 10;
    else manques.push('qui fait quoi dans l’équipe, et pourquoi ces personnes-là');
    criteres.push({ cle: 'equipe', libelle: 'Équipe', points: 15, obtenus: p, manques });
  }

  // 5. Modèle économique — 10
  {
    const manques: string[] = [];
    let p = 0;
    if (rempli(d.modele, 50)) p += 6;
    else manques.push('comment le projet gagne de l’argent');
    if (rempli(d.concurrence, 40)) p += 4;
    else manques.push('qui fait déjà ça, et ce que vous faites différemment');
    criteres.push({ cle: 'modele', libelle: 'Modèle économique', points: 10, obtenus: p, manques });
  }

  // 6. Demande de financement — 15
  {
    const manques: string[] = [];
    let p = 0;
    if (nombreRempli(d.besoin_fcfa)) p += 6;
    else manques.push('le montant recherché, en FCFA');
    if (rempli(d.usage_des_fonds, 60)) p += 6;
    else manques.push('à quoi servira précisément cet argent');
    if (rempli(d.contrepartie)) p += 3;
    else manques.push('ce que vous proposez en contrepartie');
    criteres.push({ cle: 'demande', libelle: 'Demande de financement', points: 15, obtenus: p, manques });
  }

  const total = criteres.reduce((s, c) => s + c.obtenus, 0);
  const manquesPrioritaires = criteres
    .slice()
    .sort((a, b) => b.points - b.obtenus - (a.points - a.obtenus))
    .flatMap((c) => c.manques)
    .slice(0, 3);

  return { total, criteres, manquesPrioritaires };
}

export function mentionScore(score: number): { libelle: string; couleur: string } {
  if (score >= 85) return { libelle: 'Prêt à présenter', couleur: 'var(--green)' };
  if (score >= 60) return { libelle: 'Publiable', couleur: 'var(--gold)' };
  if (score >= 35) return { libelle: 'À compléter', couleur: 'var(--cyan)' };
  return { libelle: 'Trop incomplet', couleur: 'var(--red)' };
}
