import { describe, expect, it } from 'vitest';
import { empreinte, nouveauCodePublic, nouvelId } from '@/lib/db';
import { SOURCES, empreinteJeton, libelleSource, nouveauJeton, passerelleDisponible } from '@/lib/passerelle';

describe('les identifiants', () => {
  it('portent leur préfixe', () => {
    expect(nouvelId('dos')).toMatch(/^dos_[a-z0-9]{16}$/);
  });

  it('n’emploient aucun caractère ambigu à l’œil : ni 0/O, ni 1/I', () => {
    const corps = Array.from({ length: 200 }, () => nouvelId('x').slice(2)).join('');
    // L'alphabet exclut 0, 1, I et O. Le « l » minuscule reste donc sans jumeau,
    // puisque le « 1 » ne peut jamais apparaître.
    expect(corps).not.toMatch(/[01io]/);
    expect(corps).toMatch(/^[2-9a-hj-np-z]+$/);
  });

  it('ne se répètent pas', () => {
    const lot = new Set(Array.from({ length: 2000 }, () => nouvelId('dos')));
    expect(lot.size).toBe(2000);
  });
});

describe('le code public d’un dossier', () => {
  it('se lit et se dicte : deux groupes de quatre', () => {
    expect(nouveauCodePublic()).toMatch(/^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
  });

  it('ne se répète pas', () => {
    const lot = new Set(Array.from({ length: 2000 }, () => nouveauCodePublic()));
    expect(lot.size).toBe(2000);
  });
});

describe('l’empreinte d’une publication — le socle du dossier vérifiable', () => {
  it('est stable pour un contenu identique', async () => {
    const contenu = { nom: 'Ferme Tanguy', ca: 450000 };
    expect(await empreinte(contenu)).toBe(await empreinte({ ...contenu }));
  });

  it('change dès qu’un seul chiffre bouge', async () => {
    const a = await empreinte({ nom: 'Ferme Tanguy', ca: 450000 });
    const b = await empreinte({ nom: 'Ferme Tanguy', ca: 450001 });
    expect(a).not.toBe(b);
  });

  it('fait 32 caractères hexadécimaux', async () => {
    expect(await empreinte({ x: 1 })).toMatch(/^[0-9a-f]{32}$/);
  });

  it('distingue deux dossiers différents', async () => {
    const a = await empreinte({ nom: 'A' });
    const b = await empreinte({ nom: 'B' });
    expect(a).not.toBe(b);
  });
});

describe('les jetons de la passerelle', () => {
  it('ferme la passerelle en production tant que l’activation explicite manque', () => {
    expect(passerelleDisponible(true, undefined)).toBe(false);
    expect(passerelleDisponible(true, 'false')).toBe(false);
    expect(passerelleDisponible(true, 'true')).toBe(true);
    expect(passerelleDisponible(false, undefined)).toBe(true);
  });

  it('portent le préfixe cmb_ et 32 octets', () => {
    expect(nouveauJeton()).toMatch(/^cmb_[0-9a-f]{64}$/);
  });

  it('ne se répètent pas', () => {
    const lot = new Set(Array.from({ length: 1000 }, () => nouveauJeton()));
    expect(lot.size).toBe(1000);
  });

  it('⚠ ne sont stockés qu’en empreinte : l’empreinte ne contient pas le jeton', async () => {
    const jeton = nouveauJeton();
    const e = await empreinteJeton(jeton);
    expect(e).toMatch(/^[0-9a-f]{64}$/);
    expect(e).not.toContain(jeton.slice(4));
  });

  it('la même empreinte pour le même jeton, sinon la vérification échouerait', async () => {
    const jeton = nouveauJeton();
    expect(await empreinteJeton(jeton)).toBe(await empreinteJeton(jeton));
  });

  it('deux jetons donnent deux empreintes', async () => {
    expect(await empreinteJeton(nouveauJeton())).not.toBe(await empreinteJeton(nouveauJeton()));
  });
});

describe('les sources de l’écosystème', () => {
  it('sont uniques', () => {
    const valeurs = SOURCES.map((s) => s.valeur);
    expect(new Set(valeurs).size).toBe(valeurs.length);
  });

  it('couvrent les produits FORGE déployés', () => {
    const valeurs = SOURCES.map((s) => s.valeur);
    for (const attendu of ['agrotrack', 'livestockos', 'comptrack', 'milltrack', 'taama']) {
      expect(valeurs).toContain(attendu);
    }
  });

  it('se traduisent en libellé, et retombent sur la valeur si inconnue', () => {
    expect(libelleSource('livestockos')).toBe('LivestockOS');
    expect(libelleSource('inexistant')).toBe('inexistant');
  });
});
