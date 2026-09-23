'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { nouvelId, sql } from '@/lib/db';
import { illimite, planActif } from '@/lib/plans';
import { exigerGestionnaire, exigerUtilisateur, organisationDe } from '@/lib/session';
import type { Resultat } from './dossier';


type Appartenance = NonNullable<Awaited<ReturnType<typeof organisationDe>>>;

/**
 * Le nombre d'appels ouverts, vérifié côté serveur — jamais seulement dans l'interface.
 * `sauf` permet d'exclure l'appel qu'on est en train de rouvrir, qui n'est pas encore
 * compté comme ouvert mais ne doit pas non plus se compter deux fois.
 */
async function quotaAppelsAtteint(
  appartenance: Appartenance,
  sauf?: string,
): Promise<Resultat | null> {
  if (illimite(appartenance.plan.appelsActifs)) return null;

  const compte = (await sql`
    select count(*)::int as n from appel
     where organisation_id = ${appartenance.organisation.id}
       and statut = 'ouvert'
       and id is distinct from ${sauf ?? null}
  `) as { n: number }[];

  if ((compte[0]?.n ?? 0) < appartenance.plan.appelsActifs) return null;
  return {
    ok: false,
    code: 'limite_atteinte',
    message: `Le plan ${appartenance.plan.nom} autorise ${appartenance.plan.appelsActifs} appel(s) ouvert(s) à la fois.`,
  };
}

const schemaOrganisation = z.object({
  nom: z.string().trim().min(2, 'Le nom de la structure est obligatoire.').max(140),
  pays: z.string().trim().min(2, 'Indiquez le pays.').max(80),
  type: z.enum(['incubateur', 'fonds', 'agence', 'reseau']).default('incubateur'),
});

export async function creerOrganisation(
  _precedent: Resultat | null,
  f: FormData,
): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();

  const dejaMembre = await organisationDe(utilisateur.id);
  if (dejaMembre) {
    return { ok: false, code: 'limite_atteinte', message: 'Vous appartenez déjà à une structure.' };
  }

  const analyse = schemaOrganisation.safeParse(Object.fromEntries(f.entries()));
  if (!analyse.success) {
    return { ok: false, code: 'invalide', message: analyse.error.issues[0]?.message };
  }

  const id = nouvelId('org');
  await sql`
    insert into organisation (id, nom, pays, type) values
      (${id}, ${analyse.data.nom}, ${analyse.data.pays}, ${analyse.data.type})
  `;
  await sql`
    insert into membre (id, organisation_id, user_id, role)
    values (${nouvelId('mbr')}, ${id}, ${utilisateur.id}, 'proprietaire')
  `;

  revalidatePath('/programme');
  revalidatePath('/tableau-de-bord');
  return { ok: true, message: 'Structure créée.' };
}

const schemaAppel = z.object({
  titre: z.string().trim().min(3, 'Donnez un titre à votre appel.').max(160),
  description: z.string().trim().max(4000).optional().nullable(),
  score_minimum: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      const n = Number(v ?? 0);
      return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.floor(n))) : 0;
    }),
  ferme_le: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
});

export async function creerAppel(_precedent: Resultat | null, f: FormData): Promise<Resultat> {
  const garde = await exigerGestionnaire();
  if (garde.erreur) return garde.erreur;
  const { appartenance } = garde;

  const refus = await quotaAppelsAtteint(appartenance);
  if (refus) return refus;

  const analyse = schemaAppel.safeParse(Object.fromEntries(f.entries()));
  if (!analyse.success) {
    return { ok: false, code: 'invalide', message: analyse.error.issues[0]?.message };
  }

  const secteurs = f.getAll('secteurs').map(String).filter(Boolean);
  const pays = f.getAll('pays').map(String).filter(Boolean);
  const id = nouvelId('apl');

  await sql`
    insert into appel (id, organisation_id, titre, description, secteurs, pays, score_minimum, ferme_le, statut)
    values (
      ${id}, ${appartenance.organisation.id}, ${analyse.data.titre}, ${analyse.data.description ?? null},
      ${secteurs.length ? secteurs : null}, ${pays.length ? pays : null},
      ${analyse.data.score_minimum}, ${analyse.data.ferme_le}, 'ouvert'
    )
  `;

  revalidatePath('/programme');
  revalidatePath('/flux');
  return { ok: true, message: 'Appel ouvert.', dossierId: id };
}

export async function changerStatutAppel(
  _precedent: Resultat | null,
  f: FormData,
): Promise<Resultat> {
  const garde = await exigerGestionnaire();
  if (garde.erreur) return garde.erreur;
  const { appartenance } = garde;

  const id = String(f.get('id') ?? '');
  const statut = String(f.get('statut') ?? '');
  if (!['brouillon', 'ouvert', 'ferme'].includes(statut)) {
    return { ok: false, code: 'invalide', message: 'Statut inconnu.' };
  }

  // Rouvrir un appel, c'est en ouvrir un : sans ce contrôle, fermer puis rouvrir en
  // boucle donnerait un nombre illimité d'appels ouverts sur le plan gratuit.
  if (statut === 'ouvert') {
    const refus = await quotaAppelsAtteint(appartenance, id);
    if (refus) return refus;
  }

  await sql`
    update appel set statut = ${statut}
     where id = ${id} and organisation_id = ${appartenance.organisation.id}
  `;
  revalidatePath('/programme');
  revalidatePath(`/programme/appel/${id}`);
  return { ok: true, message: statut === 'ferme' ? 'Appel fermé.' : 'Appel mis à jour.' };
}

/** Un porteur candidate à un appel avec son dossier. */
export async function candidater(_precedent: Resultat | null, f: FormData): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();
  const appelId = String(f.get('appel_id') ?? '');

  const dossiers = (await sql`
    select id, publie from dossier where user_id = ${utilisateur.id} limit 1
  `) as { id: string; publie: boolean }[];
  const dossier = dossiers[0];

  if (!dossier) {
    return { ok: false, code: 'introuvable', message: 'Montez d’abord votre dossier.' };
  }
  if (!dossier.publie) {
    return {
      ok: false,
      code: 'score_insuffisant',
      message: 'Publiez votre dossier avant de candidater.',
    };
  }

  const appels = (await sql`
    select a.id, a.statut, o.plan, o.plan_expire_le::text as plan_expire_le,
           (select count(*)::int from candidature where appel_id = a.id) as recues
      from appel a join organisation o on o.id = a.organisation_id
     where a.id = ${appelId}
  `) as {
    id: string;
    statut: string;
    plan: string;
    plan_expire_le: string | null;
    recues: number;
  }[];
  const appel = appels[0];

  if (!appel || appel.statut !== 'ouvert') {
    return { ok: false, code: 'introuvable', message: 'Cet appel n\u2019est pas ouvert.' };
  }

  // Le nombre de dossiers qu'un appel peut recevoir dépend du plan de la structure
  // qui l'a ouvert, pas de celui du porteur — qui, lui, ne paie jamais.
  const planAppel = planActif(appel.plan, appel.plan_expire_le);
  if (!illimite(planAppel.candidaturesParAppel) && appel.recues >= planAppel.candidaturesParAppel) {
    return {
      ok: false,
      code: 'limite_atteinte',
      message:
        'Cet appel a atteint le nombre de dossiers que sa structure peut recevoir. Contactez-la directement.',
    };
  }

  await sql`
    insert into candidature (id, appel_id, dossier_id)
    values (${nouvelId('can')}, ${appelId}, ${dossier.id})
    on conflict (appel_id, dossier_id) do nothing
  `;

  revalidatePath('/flux');
  revalidatePath('/tableau-de-bord');
  return { ok: true, message: 'Candidature enregistrée.' };
}

const NOTES = ['equipe', 'probleme', 'traction', 'modele', 'impact'] as const;

export async function evaluer(_precedent: Resultat | null, f: FormData): Promise<Resultat> {
  const garde = await exigerGestionnaire();
  if (garde.erreur) return garde.erreur;
  const { utilisateur, appartenance } = garde;

  const candidatureId = String(f.get('candidature_id') ?? '');

  const verif = (await sql`
    select c.id from candidature c
      join appel a on a.id = c.appel_id
     where c.id = ${candidatureId} and a.organisation_id = ${appartenance.organisation.id}
  `) as { id: string }[];
  if (verif.length === 0) {
    return { ok: false, code: 'introuvable', message: 'Cette candidature ne vous concerne pas.' };
  }

  const note = (cle: string): number | null => {
    const v = Number(f.get(cle));
    return Number.isFinite(v) && v >= 0 && v <= 5 ? Math.floor(v) : null;
  };
  const [equipe, probleme, traction, modele, impact] = NOTES.map(note);
  const commentaire = String(f.get('commentaire') ?? '').trim().slice(0, 3000) || null;

  await sql`
    insert into evaluation (id, candidature_id, user_id, equipe, probleme, traction, modele, impact, commentaire)
    values (${nouvelId('eva')}, ${candidatureId}, ${utilisateur.id}, ${equipe}, ${probleme},
            ${traction}, ${modele}, ${impact}, ${commentaire})
    on conflict (candidature_id, user_id) do update set
      equipe = excluded.equipe, probleme = excluded.probleme, traction = excluded.traction,
      modele = excluded.modele, impact = excluded.impact, commentaire = excluded.commentaire
  `;
  await sql`
    update candidature set statut = 'en_evaluation'
     where id = ${candidatureId} and statut = 'recue'
  `;

  revalidatePath('/programme');
  return { ok: true, message: 'Évaluation enregistrée.' };
}

export async function deciderCandidature(
  _precedent: Resultat | null,
  f: FormData,
): Promise<Resultat> {
  const garde = await exigerGestionnaire();
  if (garde.erreur) return garde.erreur;
  const { appartenance } = garde;

  const id = String(f.get('id') ?? '');
  const statut = String(f.get('statut') ?? '');
  if (!['retenue', 'ecartee', 'en_evaluation'].includes(statut)) {
    return { ok: false, code: 'invalide', message: 'Décision inconnue.' };
  }

  await sql`
    update candidature set statut = ${statut}, decide_le = now()
     where id = ${id} and appel_id in (
       select id from appel where organisation_id = ${appartenance.organisation.id}
     )
  `;

  revalidatePath('/programme');
  return { ok: true, message: 'Décision enregistrée.' };
}
