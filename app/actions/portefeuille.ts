'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { nouvelId, sql } from '@/lib/db';
import { exigerGestionnaire, exigerUtilisateur, organisationDe } from '@/lib/session';
import type { Resultat } from './dossier';

const entier = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(String(v).replace(/\s/g, ''));
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  });

const schemaParticipation = z.object({
  dossier_id: z.string().trim().min(1, 'Choisissez une entreprise.'),
  instrument: z.enum(['equity', 'convertible', 'pret', 'subvention']).default('equity'),
  montant_fcfa: entier,
  pourcentage: z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((v) => {
      if (v === null || v === undefined || v === '') return null;
      const n = Number(String(v).replace(',', '.'));
      return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
    }),
  valorisation_entree_fcfa: entier,
  date_entree: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
  notes: z.string().trim().max(3000).optional().nullable(),
});

export async function enregistrerParticipation(
  _precedent: Resultat | null,
  f: FormData,
): Promise<Resultat> {
  const garde = await exigerGestionnaire();
  if (garde.erreur) return garde.erreur;
  const { appartenance } = garde;

  const analyse = schemaParticipation.safeParse(Object.fromEntries(f.entries()));
  if (!analyse.success) {
    return { ok: false, code: 'invalide', message: analyse.error.issues[0]?.message };
  }
  const p = analyse.data;

  if (!p.montant_fcfa && p.instrument !== 'equity') {
    return { ok: false, code: 'invalide', message: 'Indiquez le montant engagé.' };
  }

  // On ne prend une participation que dans une entreprise dont le dossier existe et est publié :
  // sans dossier publié, il n'y a pas de trace horodatée de ce sur quoi on a investi.
  const dossiers = (await sql`
    select id, publie from dossier where id = ${p.dossier_id}
  `) as { id: string; publie: boolean }[];
  if (!dossiers[0]) {
    return { ok: false, code: 'introuvable', message: 'Cette entreprise est introuvable.' };
  }
  if (!dossiers[0].publie) {
    return {
      ok: false,
      code: 'invalide',
      message: 'Le dossier de cette entreprise n’est pas publié. Demandez-lui de le publier avant.',
    };
  }

  const id = nouvelId('par');
  await sql`
    insert into participation (id, organisation_id, dossier_id, instrument, montant_fcfa,
                               pourcentage, valorisation_entree_fcfa, date_entree, notes)
    values (${id}, ${appartenance.organisation.id}, ${p.dossier_id}, ${p.instrument},
            ${p.montant_fcfa ?? 0}, ${p.pourcentage}, ${p.valorisation_entree_fcfa},
            ${p.date_entree ?? new Date().toISOString().slice(0, 10)}, ${p.notes ?? null})
    on conflict (organisation_id, dossier_id) do update set
      instrument = excluded.instrument,
      montant_fcfa = excluded.montant_fcfa,
      pourcentage = excluded.pourcentage,
      valorisation_entree_fcfa = excluded.valorisation_entree_fcfa,
      date_entree = excluded.date_entree,
      notes = excluded.notes
  `;

  revalidatePath('/portefeuille');
  return { ok: true, message: 'Participation enregistrée.', dossierId: id };
}

/** Une valorisation ne remplace pas la précédente : elle s'ajoute. Même principe que les publications. */
export async function ajouterValorisation(
  _precedent: Resultat | null,
  f: FormData,
): Promise<Resultat> {
  const garde = await exigerGestionnaire();
  if (garde.erreur) return garde.erreur;
  const { appartenance } = garde;

  const participationId = String(f.get('participation_id') ?? '');
  const valeur = entier.parse(f.get('valeur_fcfa'));
  if (valeur === null) {
    return { ok: false, code: 'invalide', message: 'Indiquez la valeur constatée, en FCFA.' };
  }

  const verif = (await sql`
    select id from participation
     where id = ${participationId} and organisation_id = ${appartenance.organisation.id}
  `) as { id: string }[];
  if (!verif[0]) {
    return { ok: false, code: 'introuvable', message: 'Participation introuvable.' };
  }

  await sql`
    insert into valorisation (id, participation_id, valeur_fcfa, ca_mensuel_fcfa, employes, commentaire, constatee_le)
    values (${nouvelId('val')}, ${participationId}, ${valeur},
            ${entier.parse(f.get('ca_mensuel_fcfa'))}, ${entier.parse(f.get('employes'))},
            ${String(f.get('commentaire') ?? '').trim().slice(0, 2000) || null},
            ${String(f.get('constatee_le') ?? '') || new Date().toISOString().slice(0, 10)})
  `;

  revalidatePath('/portefeuille');
  return { ok: true, message: 'Valorisation ajoutée à l’historique.' };
}

export async function changerStatutParticipation(
  _precedent: Resultat | null,
  f: FormData,
): Promise<Resultat> {
  const garde = await exigerGestionnaire();
  if (garde.erreur) return garde.erreur;

  const statut = String(f.get('statut') ?? '');
  if (!['active', 'cedee', 'perdue'].includes(statut)) {
    return { ok: false, code: 'invalide', message: 'Statut inconnu.' };
  }

  await sql`
    update participation set statut = ${statut}
     where id = ${String(f.get('id') ?? '')}
       and organisation_id = ${garde.appartenance.organisation.id}
  `;
  revalidatePath('/portefeuille');
  return { ok: true, message: 'Statut mis à jour.' };
}

// ------------------------------------------------------------------ invitations

/** L’accès investisseur passe par un compte membre et une invitation nominative. */
const schemaInvitation = z.object({
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(160),
  role: z.enum(['membre', 'investisseur']).default('investisseur'),
});

export async function inviter(_precedent: Resultat | null, f: FormData): Promise<Resultat> {
  const garde = await exigerGestionnaire();
  if (garde.erreur) return garde.erreur;
  const { utilisateur, appartenance } = garde;

  if (appartenance.role !== 'proprietaire') {
    return { ok: false, code: 'introuvable', message: 'Seul le propriétaire invite des membres.' };
  }

  const analyse = schemaInvitation.safeParse(Object.fromEntries(f.entries()));
  if (!analyse.success) {
    return { ok: false, code: 'invalide', message: analyse.error.issues[0]?.message };
  }

  const compte = (await sql`
    select count(*)::int as n from membre where organisation_id = ${appartenance.organisation.id}
  `) as { n: number }[];
  const enAttente = (await sql`
    select count(*)::int as n from invitation
     where organisation_id = ${appartenance.organisation.id}
       and acceptee_le is null and expire_le > now()
  `) as { n: number }[];

  const total = (compte[0]?.n ?? 0) + (enAttente[0]?.n ?? 0);
  if (total >= appartenance.plan.membres) {
    return {
      ok: false,
      code: 'limite_atteinte',
      message: `Le plan ${appartenance.plan.nom} autorise ${appartenance.plan.membres} personnes, invitations en attente comprises.`,
    };
  }

  const code = nouvelId('inv').replace('inv_', '');
  await sql`
    insert into invitation (id, organisation_id, email, role, code, invite_par)
    values (${nouvelId('ivt')}, ${appartenance.organisation.id}, ${analyse.data.email},
            ${analyse.data.role}, ${code}, ${utilisateur.id})
  `;

  revalidatePath('/portefeuille');
  return { ok: true, message: `Invitation créée pour ${analyse.data.email}.`, dossierId: code };
}

export async function accepterInvitation(
  _precedent: Resultat | null,
  f: FormData,
): Promise<Resultat> {
  const utilisateur = await exigerUtilisateur();
  if (utilisateur.emailVerified !== true) {
    return {
      ok: false,
      code: 'invalide',
      message: 'Confirmez la maîtrise de votre adresse e-mail avant d’accepter cette invitation.',
    };
  }
  const code = String(f.get('code') ?? '').trim();

  const invitations = (await sql`
    select id, organisation_id, email, role, acceptee_le, expire_le
      from invitation where code = ${code}
  `) as {
    id: string;
    organisation_id: string;
    email: string;
    role: string;
    acceptee_le: string | null;
    expire_le: string;
  }[];
  const invitation = invitations[0];

  if (!invitation) return { ok: false, code: 'introuvable', message: 'Invitation inconnue.' };
  if (invitation.acceptee_le) {
    return { ok: false, code: 'invalide', message: 'Cette invitation a déjà été utilisée.' };
  }
  if (new Date(invitation.expire_le) < new Date()) {
    return { ok: false, code: 'invalide', message: 'Cette invitation a expiré.' };
  }
  if (invitation.email.toLowerCase() !== utilisateur.email.toLowerCase()) {
    return {
      ok: false,
      code: 'invalide',
      message: `Cette invitation a été émise pour ${invitation.email}. Connectez-vous avec cette adresse.`,
    };
  }
  if (await organisationDe(utilisateur.id)) {
    return { ok: false, code: 'invalide', message: 'Vous appartenez déjà à une structure.' };
  }

  await sql`
    insert into membre (id, organisation_id, user_id, role)
    values (${nouvelId('mbr')}, ${invitation.organisation_id}, ${utilisateur.id}, ${invitation.role})
    on conflict (organisation_id, user_id) do nothing
  `;
  await sql`update invitation set acceptee_le = now() where id = ${invitation.id}`;

  revalidatePath('/portefeuille');
  revalidatePath('/tableau-de-bord');

  // Redirection côté serveur : une fois l'invitation consommée, la page d'invitation
  // se re-rend en « déjà utilisée » et démonte le formulaire — un effet client n'aurait
  // pas le temps de partir.
  redirect('/portefeuille');
}

export async function revoquerInvitation(
  _precedent: Resultat | null,
  f: FormData,
): Promise<Resultat> {
  const garde = await exigerGestionnaire();
  if (garde.erreur) return garde.erreur;

  await sql`
    update invitation set expire_le = now()
     where id = ${String(f.get('id') ?? '')}
       and organisation_id = ${garde.appartenance.organisation.id}
       and acceptee_le is null
  `;
  revalidatePath('/portefeuille');
  return { ok: true, message: 'Invitation révoquée.' };
}
