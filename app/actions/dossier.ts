'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { empreinte, nouveauCodePublic, nouvelId, sql } from '@/lib/db';
import { calculerScore } from '@/lib/score';
import { DOSSIERS_GRATUITS, SCORE_PUBLICATION } from '@/lib/plans';
import { investisseurVerifie } from '@/lib/portefeuille';
import { exigerUtilisateur, organisationDe } from '@/lib/session';
import type { Dossier } from '@/lib/types';

export interface Resultat {
  ok: boolean;
  message?: string;
  code?: 'limite_atteinte' | 'score_insuffisant' | 'invalide' | 'introuvable';
  dossierId?: string;
}

const texte = (max: number) => z.string().trim().max(max).optional().nullable();
const entier = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  });

const schemaDossier = z.object({
  nom: z.string().trim().min(2, 'Le nom du projet est obligatoire.').max(120),
  secteur: z.string().trim().max(80).default(''),
  pays: z.string().trim().max(80).default(''),
  ville: texte(80),
  stade: z.enum(['idee', 'prototype', 'premiers_clients', 'croissance']).default('idee'),
  resume: texte(400),
  probleme: texte(2000),
  solution: texte(2000),
  clients: texte(1000),
  modele: texte(1500),
  concurrence: texte(1500),
  equipe_taille: entier,
  equipe_description: texte(2000),
  annee_creation: entier,
  formalise: z.union([z.boolean(), z.string()]).optional().transform((v) => v === true || v === 'on' || v === 'true'),
  ca_mensuel_fcfa: entier,
  clients_actifs: entier,
  croissance_commentaire: texte(1500),
  besoin_fcfa: entier,
  usage_des_fonds: texte(2000),
  contrepartie: texte(40),
  contact_nom: texte(120),
  contact_email: texte(160),
  contact_telephone: texte(40),
});

function depuisFormData(f: FormData) {
  const brut = Object.fromEntries(f.entries());
  return schemaDossier.safeParse(brut);
}

/** Crée le dossier s'il n'existe pas, le met à jour sinon. Un dossier par compte sur le plan gratuit. */
export async function enregistrerDossier(_precedent: Resultat | null, f: FormData): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();
  const analyse = depuisFormData(f);

  if (!analyse.success) {
    return {
      ok: false,
      code: 'invalide',
      message: analyse.error.issues[0]?.message ?? 'Certains champs sont invalides.',
    };
  }
  const d = analyse.data;
  const idExistant = String(f.get('id') ?? '').trim();

  if (idExistant) {
    const lignes = (await sql`
      select id from dossier where id = ${idExistant} and user_id = ${utilisateur.id}
    `) as { id: string }[];
    if (lignes.length === 0) {
      return { ok: false, code: 'introuvable', message: 'Ce dossier ne vous appartient pas.' };
    }

    await sql`
      update dossier set
        nom = ${d.nom}, secteur = ${d.secteur}, pays = ${d.pays}, ville = ${d.ville},
        stade = ${d.stade}, resume = ${d.resume}, probleme = ${d.probleme},
        solution = ${d.solution}, clients = ${d.clients}, modele = ${d.modele},
        concurrence = ${d.concurrence}, equipe_taille = ${d.equipe_taille},
        equipe_description = ${d.equipe_description}, annee_creation = ${d.annee_creation},
        formalise = ${d.formalise}, ca_mensuel_fcfa = ${d.ca_mensuel_fcfa},
        clients_actifs = ${d.clients_actifs}, croissance_commentaire = ${d.croissance_commentaire},
        besoin_fcfa = ${d.besoin_fcfa}, usage_des_fonds = ${d.usage_des_fonds},
        contrepartie = ${d.contrepartie}, contact_nom = ${d.contact_nom},
        contact_email = ${d.contact_email}, contact_telephone = ${d.contact_telephone},
        maj_le = now()
      where id = ${idExistant} and user_id = ${utilisateur.id}
    `;

    revalidatePath('/tableau-de-bord');
    revalidatePath('/tableau-de-bord/dossier');
    return { ok: true, dossierId: idExistant, message: 'Dossier enregistré.' };
  }

  // Création — la limite du plan gratuit est vérifiée ici, côté serveur.
  const compte = (await sql`
    select count(*)::int as n from dossier where user_id = ${utilisateur.id}
  `) as { n: number }[];

  if ((compte[0]?.n ?? 0) >= DOSSIERS_GRATUITS) {
    return {
      ok: false,
      code: 'limite_atteinte',
      message: `Le plan gratuit permet ${DOSSIERS_GRATUITS} dossier. Écrivez-nous pour en ouvrir un second.`,
    };
  }

  const id = nouvelId('dos');
  await sql`
    insert into dossier (
      id, user_id, nom, secteur, pays, ville, stade, resume, probleme, solution, clients,
      modele, concurrence, equipe_taille, equipe_description, annee_creation, formalise,
      ca_mensuel_fcfa, clients_actifs, croissance_commentaire, besoin_fcfa, usage_des_fonds,
      contrepartie, contact_nom, contact_email, contact_telephone
    ) values (
      ${id}, ${utilisateur.id}, ${d.nom}, ${d.secteur}, ${d.pays}, ${d.ville}, ${d.stade},
      ${d.resume}, ${d.probleme}, ${d.solution}, ${d.clients}, ${d.modele}, ${d.concurrence},
      ${d.equipe_taille}, ${d.equipe_description}, ${d.annee_creation}, ${d.formalise},
      ${d.ca_mensuel_fcfa}, ${d.clients_actifs}, ${d.croissance_commentaire}, ${d.besoin_fcfa},
      ${d.usage_des_fonds}, ${d.contrepartie}, ${d.contact_nom ?? utilisateur.name},
      ${d.contact_email ?? utilisateur.email}, ${d.contact_telephone}
    )
  `;

  revalidatePath('/tableau-de-bord');
  return { ok: true, dossierId: id, message: 'Dossier créé.' };
}

/**
 * Publie le dossier : fige son contenu, l'horodate côté serveur et ajoute une ligne
 * à l'historique. On ne réécrit jamais une publication — c'est tout l'intérêt.
 */
export async function publierDossier(
  _precedent: Resultat | null,
  f: FormData,
): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();
  const id = String(f.get('id') ?? '').trim();

  const lignes = (await sql`
    select * from dossier where id = ${id} and user_id = ${utilisateur.id}
  `) as Dossier[];
  const dossier = lignes[0];

  if (!dossier) return { ok: false, code: 'introuvable', message: 'Dossier introuvable.' };

  const { total } = calculerScore(dossier);
  if (total < SCORE_PUBLICATION) {
    return {
      ok: false,
      code: 'score_insuffisant',
      message: `Il faut ${SCORE_PUBLICATION} points pour publier. Vous en êtes à ${total}.`,
    };
  }
  if (!dossier.contact_email) {
    return {
      ok: false,
      code: 'invalide',
      message: 'Renseignez un e-mail de contact : sans lui, personne ne peut vous joindre.',
    };
  }

  const versions = (await sql`
    select coalesce(max(version), 0)::int as v from publication where dossier_id = ${id}
  `) as { v: number }[];
  const version = (versions[0]?.v ?? 0) + 1;

  const code = dossier.code_public ?? nouveauCodePublic();
  const contenu = { ...dossier, code_public: code, publie: true };
  const signature = await empreinte(contenu);

  await sql`
    insert into publication (id, dossier_id, version, score, empreinte, contenu)
    values (${nouvelId('pub')}, ${id}, ${version}, ${total}, ${signature}, ${JSON.stringify(contenu)})
  `;
  await sql`
    update dossier set publie = true, code_public = ${code}, maj_le = now() where id = ${id}
  `;

  revalidatePath('/tableau-de-bord');
  revalidatePath('/flux');
  revalidatePath(`/dossier/${code}`);
  return { ok: true, dossierId: id, message: `Publication n° ${version} enregistrée.` };
}

/** Retire le dossier du flux public. L'historique des publications reste intact. */
export async function retirerDossier(_precedent: Resultat | null, f: FormData): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();
  const id = String(f.get('id') ?? '').trim();

  await sql`update dossier set publie = false where id = ${id} and user_id = ${utilisateur.id}`;
  revalidatePath('/tableau-de-bord');
  revalidatePath('/flux');
  return { ok: true, message: 'Dossier retiré du flux public.' };
}

/** Un financeur marque son intérêt. Aucun montant, aucun engagement, aucun flux d'argent. */
export async function marquerInteret(_precedent: Resultat | null, f: FormData): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();
  const appartenance = await organisationDe(utilisateur.id);
  if (!investisseurVerifie(utilisateur.emailVerified, appartenance?.role)) {
    return {
      ok: false,
      code: 'introuvable',
      message: 'Un compte investisseur invité avec une adresse e-mail vérifiée est requis.',
    };
  }
  const dossierId = String(f.get('dossier_id') ?? '').trim();
  const message = String(f.get('message') ?? '').trim().slice(0, 1000) || null;

  const lignes = (await sql`
    select id, code_public from dossier where id = ${dossierId} and publie
  `) as { id: string; code_public: string }[];
  if (lignes.length === 0) {
    return { ok: false, code: 'introuvable', message: 'Ce dossier n’est pas publié.' };
  }

  await sql`
    insert into interet (id, dossier_id, user_id, message)
    values (${nouvelId('int')}, ${dossierId}, ${utilisateur.id}, ${message})
    on conflict (dossier_id, user_id) do update set message = excluded.message
  `;

  revalidatePath(`/dossier/${lignes[0].code_public}`);
  return {
    ok: true,
    message: 'Intérêt transmis. Le porteur reçoit vos coordonnées et vous contactera directement.',
  };
}
