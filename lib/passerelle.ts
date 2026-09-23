/**
 * La passerelle FORGE.
 *
 * Un porteur qui tient déjà ses chiffres dans AgroTrack, LivestockOS ou CompTrack n'a
 * aucune raison de les retaper ici. Il génère un jeton, le colle dans l'autre application,
 * et celle-ci transmet ses chiffres réels — datés, issus de l'exploitation, pas d'un
 * tableur rempli la veille du rendez-vous.
 *
 * C'est le seul avantage de COMBINE qu'un concurrent ne peut pas copier : il faudrait
 * qu'il possède aussi les applications d'en face.
 *
 * Le jeton n'est stocké qu'en empreinte SHA-256 : une fuite de la base ne permet pas de
 * s'en servir. Il n'est affiché qu'une fois, à sa création.
 */

export const SOURCES = [
  { valeur: 'agrotrack', libelle: 'AgroTrack BF', aide: 'Coopératives agricoles — collectes, pesées, paiements' },
  { valeur: 'livestockos', libelle: 'LivestockOS', aide: 'Cheptel — santé, ventes, passeport vérifiable' },
  { valeur: 'comptrack', libelle: 'CompTrack', aide: 'Comptabilité SYSCOHADA' },
  { valeur: 'milltrack', libelle: 'MillTrack', aide: 'Minoteries, huileries, rizeries' },
  { valeur: 'taama', libelle: 'TAAMA', aide: 'ERP industriel PME' },
  { valeur: 'forja', libelle: 'FORJA', aide: 'Export café' },
  { valeur: 'burkinacollect', libelle: 'BurkinaCollect', aide: 'Collecte de données terrain' },
  { valeur: 'valuechain', libelle: 'ValueChain Connect', aide: 'Marketplace B2B' },
  { valeur: 'sugu', libelle: 'SUGU', aide: 'Commerce informel' },
] as const;

export function passerelleDisponible(enProduction: boolean, activation: string | undefined) {
  return !enProduction || activation === 'true';
}

export type Source = (typeof SOURCES)[number]['valeur'];

export const libelleSource = (v: string) =>
  SOURCES.find((s) => s.valeur === v)?.libelle ?? v;

/** Les champs qu'une application FORGE peut transmettre. Tout est facultatif sauf la source. */
export interface ChargePasserelle {
  source: string;
  constate_le?: string;
  ca_mensuel_fcfa?: number;
  clients_actifs?: number;
  employes?: number;
  commentaire?: string;
  lien_verification?: string;
}

/** Ce qu'un import applique au dossier, une fois que le porteur l'a accepté. */
export const CHAMPS_APPLICABLES = [
  { cle: 'ca_mensuel_fcfa', libelle: 'Chiffre d’affaires mensuel', unite: 'FCFA' },
  { cle: 'clients_actifs', libelle: 'Clients actifs', unite: '' },
  { cle: 'equipe_taille', libelle: 'Taille de l’équipe', unite: 'personnes' },
] as const;

export async function empreinteJeton(jeton: string): Promise<string> {
  const condensat = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(jeton));
  return Array.from(new Uint8Array(condensat))
    .map((o) => o.toString(16).padStart(2, '0'))
    .join('');
}

export function nouveauJeton(): string {
  const octets = crypto.getRandomValues(new Uint8Array(32));
  return `cmb_${Array.from(octets)
    .map((o) => o.toString(16).padStart(2, '0'))
    .join('')}`;
}
