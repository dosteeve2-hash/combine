import { describe, expect, it } from 'vitest';
import { agreger, estInvestisseur, fcfaCourt, investisseurVerifie, peutGerer, valeurDe } from '@/lib/portefeuille';
import type { LignePortefeuille } from '@/lib/portefeuille';

const ligne = (p: Partial<LignePortefeuille> = {}): LignePortefeuille => ({
  id: 'par_1', dossier_id: 'dos_1', nom: 'Ferme Tanguy', pays: 'Burkina Faso',
  secteur: 'Agriculture', code_public: 'K7M2-P9XQ', instrument: 'equity',
  montant_fcfa: '2000000', pourcentage: '12.50', valorisation_entree_fcfa: '16000000',
  date_entree: '2026-03-15', statut: 'active', notes: null,
  valeur_actuelle_fcfa: null, constatee_le: null, ca_mensuel_fcfa: null, employes: null,
  ...p,
});

describe('la valeur d’une participation — la prudence est la règle', () => {
  it('sans valorisation constatée, elle vaut ce qu’elle a coûté', () => {
    expect(valeurDe(ligne())).toBe(2_000_000);
  });

  it('avec une valorisation, c’est elle qui fait foi', () => {
    expect(valeurDe(ligne({ valeur_actuelle_fcfa: '3200000' }))).toBe(3_200_000);
  });

  it('une participation perdue vaut zéro, même valorisée', () => {
    expect(valeurDe(ligne({ statut: 'perdue', valeur_actuelle_fcfa: '9000000' }))).toBe(0);
  });

  it('une valorisation à zéro est respectée, pas ignorée', () => {
    expect(valeurDe(ligne({ valeur_actuelle_fcfa: '0' }))).toBe(0);
  });

  it('aucune plus-value n’est inventée par défaut', () => {
    const l = ligne();
    expect(valeurDe(l)).toBe(Number(l.montant_fcfa));
  });
});

describe('les agrégats', () => {
  it('un portefeuille vide ne donne pas de multiple', () => {
    const a = agreger([]);
    expect(a.investi).toBe(0);
    expect(a.multiple).toBeNull();
  });

  it('calcule le multiple sur la valeur constatée', () => {
    const a = agreger([ligne({ valeur_actuelle_fcfa: '3000000' })]);
    expect(a.multiple).toBeCloseTo(1.5, 5);
  });

  it('une ligne non valorisée donne un multiple de 1', () => {
    expect(agreger([ligne()]).multiple).toBe(1);
  });

  it('compte les statuts séparément', () => {
    const a = agreger([
      ligne({ id: 'a', statut: 'active' }),
      ligne({ id: 'b', statut: 'cedee' }),
      ligne({ id: 'c', statut: 'perdue' }),
    ]);
    expect([a.actives, a.cedees, a.perdues]).toEqual([1, 1, 1]);
  });

  it('une perte tire le multiple vers le bas', () => {
    const a = agreger([ligne({ id: 'a' }), ligne({ id: 'b', statut: 'perdue' })]);
    expect(a.investi).toBe(4_000_000);
    expect(a.valeur).toBe(2_000_000);
    expect(a.multiple).toBe(0.5);
  });

  it('additionne les emplois soutenus', () => {
    expect(agreger([ligne({ id: 'a', employes: 7 }), ligne({ id: 'b', employes: 3 })]).emplois).toBe(10);
  });
});

describe('les rôles', () => {
  it('propriétaire et membre peuvent gérer', () => {
    expect(peutGerer('proprietaire')).toBe(true);
    expect(peutGerer('membre')).toBe(true);
  });

  it('un investisseur ne gère rien', () => {
    expect(peutGerer('investisseur')).toBe(false);
    expect(estInvestisseur('investisseur')).toBe(true);
  });

  it('un rôle inconnu ne donne aucun droit', () => {
    expect(peutGerer('inconnu')).toBe(false);
    expect(estInvestisseur('inconnu')).toBe(false);
  });

  it('l’espace financeur exige à la fois le rôle et une adresse vérifiée', () => {
    expect(investisseurVerifie(true, 'investisseur')).toBe(true);
    expect(investisseurVerifie(false, 'investisseur')).toBe(false);
    expect(investisseurVerifie(true, 'membre')).toBe(false);
    expect(investisseurVerifie(undefined, 'investisseur')).toBe(false);
  });
});

describe('fcfaCourt', () => {
  it.each([
    [450, '450'],
    [45_000, '45 k'],
    [2_000_000, '2 M'],
    [2_500_000, '2.5 M'],
    [1_200_000_000, '1.2 Md'],
  ])('%i → %s', (entree, attendu) => {
    expect(fcfaCourt(entree)).toBe(attendu);
  });
});
