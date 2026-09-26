import { describe, expect, it } from 'vitest';
import { DOSSIERS_GRATUITS, PLANS, SCORE_PUBLICATION, formatFcfa, illimite, planActif } from '@/lib/plans';

const jours = (n: number) => new Date(Date.now() + n * 86_400_000);

describe('les plans', () => {
  it('le plan gratuit ne coûte rien et ne donne pas l’export bailleur', () => {
    expect(PLANS.essai.prixMensuelFcfa).toBe(0);
    expect(PLANS.essai.exportBailleur).toBe(false);
  });

  it('les bornes croissent du plan le moins cher au plus cher', () => {
    expect(PLANS.essai.appelsActifs).toBeLessThan(PLANS.programme.appelsActifs);
    expect(PLANS.programme.appelsActifs).toBeLessThan(PLANS.institution.appelsActifs);
    expect(PLANS.essai.membres).toBeLessThan(PLANS.programme.membres);
  });

  it('l’abonnement annuel revient moins cher que douze mois', () => {
    for (const p of [PLANS.programme, PLANS.institution]) {
      expect(p.prixAnnuelFcfa).toBeLessThan(p.prixMensuelFcfa * 12);
    }
  });

  it('seul le plan Institution est illimité', () => {
    expect(illimite(PLANS.institution.appelsActifs)).toBe(true);
    expect(illimite(PLANS.programme.appelsActifs)).toBe(false);
    expect(illimite(PLANS.essai.appelsActifs)).toBe(false);
  });

  it('chaque code de plan correspond à sa clé', () => {
    for (const [cle, plan] of Object.entries(PLANS)) expect(plan.code).toBe(cle);
  });
});

describe('planActif — le repli doit toujours aller vers le moins permissif', () => {
  it('un plan payant sans échéance retombe sur Essai', () => {
    expect(planActif('programme', null).code).toBe('essai');
  });

  it('un plan payant expiré retombe sur Essai', () => {
    expect(planActif('institution', jours(-1)).code).toBe('essai');
  });

  it('un plan payant en cours est bien actif', () => {
    expect(planActif('programme', jours(30)).code).toBe('programme');
  });

  it('accepte une date en chaîne, comme celle qui sort de la base', () => {
    expect(planActif('programme', jours(30).toISOString()).code).toBe('programme');
  });

  it('un code de plan inconnu retombe sur Essai plutôt que de planter', () => {
    expect(planActif('plan-imaginaire', jours(30)).code).toBe('essai');
    expect(planActif(null, null).code).toBe('essai');
  });

  it('l’échéance du jour même n’ouvre plus les droits', () => {
    expect(planActif('programme', new Date(Date.now() - 1000)).code).toBe('essai');
  });
});

describe('les constantes du produit', () => {
  it('un porteur tient un seul dossier sur le plan gratuit', () => {
    expect(DOSSIERS_GRATUITS).toBe(1);
  });

  it('le seuil de publication reste atteignable', () => {
    expect(SCORE_PUBLICATION).toBeGreaterThan(0);
    expect(SCORE_PUBLICATION).toBeLessThanOrEqual(100);
  });
});

describe('formatFcfa', () => {
  it('sépare les milliers et garde l’unité', () => {
    expect(formatFcfa(45000)).toMatch(/45\s?000 FCFA/);
    expect(formatFcfa(0)).toMatch(/0 FCFA/);
  });
});
