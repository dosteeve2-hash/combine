import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';

/** Levée quand la base n'est pas configurée : les routes la traduisent en 503. */
export class BaseNonConfiguree extends Error {
  constructor() {
    super('Base non configurée : DATABASE_URL est absent.');
    this.name = 'BaseNonConfiguree';
  }
}

/** Le contrat commun aux deux pilotes : un gabarit balisé qui rend les lignes. */
type Requete = <T = Record<string, unknown>>(
  fragments: TemplateStringsArray,
  ...valeurs: unknown[]
) => Promise<T[]>;

export function baseConfiguree(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * En production on parle à Neon par HTTP : pas de pool à entretenir, ce qui convient
 * au serverless. En local — ou sur n'importe quel Postgres ordinaire — on repasse sur
 * le pilote `pg`. Les deux exposent exactement le même gabarit balisé, donc le reste
 * du code ne sait pas lequel tourne, et les requêtes restent paramétrées des deux côtés.
 */
function viaPg(url: string): Requete {
  const pool = new Pool({ connectionString: url, max: 5 });
  return async <T>(fragments: TemplateStringsArray, ...valeurs: unknown[]) => {
    let texte = '';
    fragments.forEach((fragment, i) => {
      texte += fragment;
      if (i < valeurs.length) texte += `$${i + 1}`;
    });
    const resultat = await pool.query(texte, valeurs as unknown[]);
    return resultat.rows as T[];
  };
}

let memo: { requete: Requete; ordinaire: boolean } | null = null;

/** La connexion n'est ouverte qu'à la première requête réelle, jamais à l'import ni au build. */
function connexion() {
  if (memo) return memo;
  const url = process.env.DATABASE_URL;
  if (!url) throw new BaseNonConfiguree();
  const surNeon = /\.neon\.tech(?::|\/|$)/.test(new URL(url).host + '/');
  memo = {
    requete: surNeon ? (neon(url) as unknown as Requete) : viaPg(url),
    ordinaire: !surNeon,
  };
  return memo;
}

export const sql: Requete = (fragments, ...valeurs) => connexion().requete(fragments, ...valeurs);

/** Vrai quand la base est un Postgres ordinaire plutôt qu'un point d'accès Neon. */
export function postgresOrdinaire(): boolean {
  return connexion().ordinaire;
}

/** Identifiant court, lisible, sans caractère ambigu (ni 0/O ni 1/I/l). */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function nouvelId(prefixe: string): string {
  const octets = crypto.getRandomValues(new Uint8Array(16));
  let s = '';
  for (const o of octets) s += ALPHABET[o % ALPHABET.length];
  return `${prefixe}_${s.toLowerCase()}`;
}

/** Le code qui apparaît dans l'URL publique d'un dossier : /dossier/K7M2-P9XQ */
export function nouveauCodePublic(): string {
  const octets = crypto.getRandomValues(new Uint8Array(8));
  let s = '';
  for (const o of octets) s += ALPHABET[o % ALPHABET.length];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}`;
}

/**
 * L'empreinte d'une publication. C'est elle qui rend le dossier vérifiable :
 * le contenu publié est figé, et toute modification ultérieure produit une
 * empreinte différente. On ne réécrit jamais une publication — on en ajoute une.
 */
export async function empreinte(contenu: unknown): Promise<string> {
  const donnees = new TextEncoder().encode(JSON.stringify(contenu));
  const condensat = await crypto.subtle.digest('SHA-256', donnees);
  return Array.from(new Uint8Array(condensat))
    .map((o) => o.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}
