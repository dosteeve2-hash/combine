'use server';

import { revalidatePath } from 'next/cache';
import { nouvelId, sql } from '@/lib/db';
import { exigerUtilisateur } from '@/lib/session';
import { empreinteJeton, nouveauJeton, SOURCES } from '@/lib/passerelle';
import type { ChargePasserelle } from '@/lib/passerelle';
import type { Resultat } from './dossier';

/** Retourne le dossier de l'utilisateur, ou null. Un compte, un dossier. */
async function monDossier(userId: string) {
  const lignes = (await sql`
    select id from dossier where user_id = ${userId} order by cree_le asc limit 1
  `) as { id: string }[];
  return lignes[0] ?? null;
}

export interface ResultatJeton extends Resultat {
  jeton?: string;
}

export async function creerJeton(
  _precedent: ResultatJeton | null,
  f: FormData,
): Promise<ResultatJeton> {
  const utilisateur = await exigerUtilisateur();
  const source = String(f.get('source') ?? '');

  if (!SOURCES.some((s) => s.valeur === source)) {
    return { ok: false, code: 'invalide', message: 'Application inconnue.' };
  }

  const dossier = await monDossier(utilisateur.id);
  if (!dossier) {
    return { ok: false, code: 'introuvable', message: 'Créez d’abord votre dossier.' };
  }

  const jeton = nouveauJeton();
  await sql`
    insert into jeton_passerelle (id, dossier_id, source, jeton_empreinte)
    values (${nouvelId('jtn')}, ${dossier.id}, ${source}, ${await empreinteJeton(jeton)})
  `;

  revalidatePath('/tableau-de-bord/passerelle');
  return {
    ok: true,
    // Affiché une seule fois : seule l'empreinte est conservée en base.
    jeton,
    message: 'Jeton créé. Copiez-le maintenant — il ne sera plus jamais affiché.',
  };
}

export async function revoquerJeton(_precedent: Resultat | null, f: FormData): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();
  const dossier = await monDossier(utilisateur.id);
  if (!dossier) return { ok: false, code: 'introuvable' };

  await sql`
    update jeton_passerelle set revoque = true
     where id = ${String(f.get('id') ?? '')} and dossier_id = ${dossier.id}
  `;
  revalidatePath('/tableau-de-bord/passerelle');
  return { ok: true, message: 'Jeton révoqué.' };
}

/**
 * Applique un import au dossier. C'est une décision du porteur, jamais automatique :
 * une application extérieure peut alimenter le dossier, elle ne le réécrit pas dans son dos.
 */
export async function appliquerImport(_precedent: Resultat | null, f: FormData): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();
  const dossier = await monDossier(utilisateur.id);
  if (!dossier) return { ok: false, code: 'introuvable' };

  const imports = (await sql`
    select id, charge from import_passerelle
     where id = ${String(f.get('id') ?? '')} and dossier_id = ${dossier.id} and not applique
  `) as { id: string; charge: ChargePasserelle }[];
  const imp = imports[0];
  if (!imp) return { ok: false, code: 'introuvable', message: 'Import introuvable ou déjà appliqué.' };

  const c = imp.charge;
  const nombre = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  };

  await sql`
    update dossier set
      ca_mensuel_fcfa = coalesce(${nombre(c.ca_mensuel_fcfa)}, ca_mensuel_fcfa),
      clients_actifs  = coalesce(${nombre(c.clients_actifs)}, clients_actifs),
      equipe_taille   = coalesce(${nombre(c.employes)}, equipe_taille),
      maj_le = now()
    where id = ${dossier.id}
  `;
  await sql`update import_passerelle set applique = true where id = ${imp.id}`;

  revalidatePath('/tableau-de-bord/passerelle');
  revalidatePath('/tableau-de-bord/dossier');
  return {
    ok: true,
    message: 'Chiffres repris dans votre dossier. Republiez-le pour qu’ils soient visibles.',
  };
}
