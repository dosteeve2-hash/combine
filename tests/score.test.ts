import { describe, expect, it } from 'vitest';
import { calculerScore, mentionScore } from '@/lib/score';
import { SCORE_PUBLICATION } from '@/lib/plans';
import type { Dossier } from '@/lib/types';

const complet: Partial<Dossier> = {
  nom: 'Ferme avicole Tanguy',
  secteur: 'Agriculture',
  pays: 'Burkina Faso',
  stade: 'premiers_clients',
  resume: 'Nous livrons 4000 oeufs par semaine aux boulangeries de Bobo, a prix stable.',
  probleme:
    'Les boulangeries subissent des ruptures et des prix qui doublent en saison seche, ce qui casse leur production.',
  solution:
    'Un elevage de 1200 pondeuses avec un contrat de livraison hebdomadaire a prix fixe sur douze mois.',
  clients: 'Le gerant d une boulangerie de quartier employant cinq a quinze personnes.',
  modele: 'Vente au contrat, avec une marge de 18 pour cent sur chaque plateau livre.',
  concurrence: 'Les grossistes du marche central, qui ne garantissent ni prix ni regularite.',
  equipe_taille: 4,
  equipe_description:
    'Aminata dirige l exploitation depuis 2024, Issa gere la logistique, deux employes sur site.',
  annee_creation: 2024,
  ca_mensuel_fcfa: 450000,
  clients_actifs: 12,
  croissance_commentaire: 'Trois clients en janvier, douze en aout. Le CA a double.',
  besoin_fcfa: 5000000,
  usage_des_fonds: 'Trois millions pour la couveuse, un million de provende, un de tresorerie.',
  contrepartie: 'equity',
};

describe('le score de préparation', () => {
  it('donne 100 à un dossier entièrement rempli', () => {
    expect(calculerScore(complet).total).toBe(100);
  });

  it('répartit exactement 100 points entre les critères', () => {
    const somme = calculerScore({}).criteres.reduce((s, c) => s + c.points, 0);
    expect(somme).toBe(100);
  });

  it('ne donne aucun point à un dossier vide', () => {
    expect(calculerScore({}).total).toBe(0);
  });

  it('ne descend jamais sous zéro ni au-dessus de cent', () => {
    for (const d of [{}, complet, { ...complet, nom: '' }]) {
      const t = calculerScore(d).total;
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(100);
    }
  });

  it('nomme ce qui manque, et rien de plus', () => {
    const { criteres } = calculerScore(complet);
    expect(criteres.every((c) => c.manques.length === 0)).toBe(true);
  });

  it('met la traction en tête des manques — c’est ce qui décide', () => {
    const sansTraction = {
      ...complet,
      ca_mensuel_fcfa: null,
      clients_actifs: null,
      croissance_commentaire: null,
      annee_creation: null,
    };
    const { manquesPrioritaires } = calculerScore(sansTraction);
    expect(manquesPrioritaires[0]).toMatch(/chiffre d’affaires/i);
  });

  it('refuse la publication d’un dossier trop maigre', () => {
    const maigre = { nom: 'Test', secteur: 'Agriculture', pays: 'Mali', stade: 'idee' };
    expect(calculerScore(maigre).total).toBeLessThan(SCORE_PUBLICATION);
  });

  it('traite « 0 » comme une valeur absente pour un chiffre d’affaires', () => {
    const zero = calculerScore({ ...complet, ca_mensuel_fcfa: 0 }).total;
    const renseigne = calculerScore(complet).total;
    expect(zero).toBeLessThan(renseigne);
  });

  it('accepte un chiffre d’affaires transmis en chaîne de caractères', () => {
    const texte = calculerScore({ ...complet, ca_mensuel_fcfa: '450000' }).total;
    expect(texte).toBe(100);
  });

  it('ignore un texte trop court, qui ne dit rien à un financeur', () => {
    const bref = calculerScore({ ...complet, probleme: 'Trop court.' }).total;
    expect(bref).toBeLessThan(100);
  });
});

describe('la mention affichée', () => {
  it.each([
    [0, 'Trop incomplet'],
    [34, 'Trop incomplet'],
    [35, 'À compléter'],
    [59, 'À compléter'],
    [60, 'Publiable'],
    [84, 'Publiable'],
    [85, 'Prêt à présenter'],
    [100, 'Prêt à présenter'],
  ])('%i points → « %s »', (score, attendu) => {
    expect(mentionScore(score).libelle).toBe(attendu);
  });

  it('le seuil de publication et la mention « Publiable » coïncident', () => {
    expect(mentionScore(SCORE_PUBLICATION).libelle).toBe('Publiable');
    expect(mentionScore(SCORE_PUBLICATION - 1).libelle).not.toBe('Publiable');
  });
});
