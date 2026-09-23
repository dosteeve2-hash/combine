import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './auth';
import { sql } from './db';
import { planActif, type Plan } from './plans';
import { peutGerer } from './portefeuille';
import { verificationEmailRequise } from './email-config';
import type { Organisation } from './types';

export async function sessionActuelle() {
  return auth.api.getSession({ headers: await headers() });
}

export async function exigerUtilisateur() {
  const session = await sessionActuelle();
  if (!session?.user) redirect('/connexion');
  if (verificationEmailRequise && !session.user.emailVerified) redirect('/verification-requise');
  return session.user;
}

export interface Appartenance {
  organisation: Organisation;
  role: string;
  plan: Plan;
}

/** L'organisation à laquelle l'utilisateur appartient, s'il en a une. */
export async function organisationDe(userId: string): Promise<Appartenance | null> {
  const lignes = (await sql`
    select o.*, m.role as role_membre
      from membre m
      join organisation o on o.id = m.organisation_id
     where m.user_id = ${userId}
     order by m.cree_le asc
     limit 1
  `) as (Organisation & { role_membre: string })[];

  const ligne = lignes[0];
  if (!ligne) return null;

  const { role_membre, ...organisation } = ligne;
  return {
    organisation,
    role: role_membre,
    plan: planActif(organisation.plan, organisation.plan_expire_le),
  };
}

export async function exigerOrganisation(userId: string): Promise<Appartenance> {
  const appartenance = await organisationDe(userId);
  if (!appartenance) redirect('/programme/creer');
  return appartenance;
}

/**
 * Le droit d'écrire dans une structure.
 *
 * Un `investisseur` n'a qu'un accès en lecture au portefeuille : c'est ce que
 * l'interface lui promet, et ce doit donc être vrai côté serveur. Cacher un lien
 * de navigation n'est pas un contrôle d'accès — toute action de structure passe
 * par ici, sans exception.
 */
export type Garde =
  | { erreur: { ok: false; code: 'introuvable'; message: string }; utilisateur?: undefined; appartenance?: undefined }
  | { erreur?: undefined; utilisateur: Awaited<ReturnType<typeof exigerUtilisateur>>; appartenance: Appartenance };

export async function exigerGestionnaire(): Promise<Garde> {
  const utilisateur = await exigerUtilisateur();
  const appartenance = await organisationDe(utilisateur.id);

  if (!appartenance) {
    return {
      erreur: { ok: false, code: 'introuvable', message: 'Créez d\u2019abord votre structure.' },
    };
  }
  if (!peutGerer(appartenance.role)) {
    return {
      erreur: {
        ok: false,
        code: 'introuvable',
        message: 'Votre accès à cette structure est en lecture seule.',
      },
    };
  }
  return { utilisateur, appartenance };
}

/** Comme `exigerOrganisation`, mais réservé aux pages de gestion. */
export async function exigerOrganisationGeree(userId: string): Promise<Appartenance> {
  const appartenance = await exigerOrganisation(userId);
  if (!peutGerer(appartenance.role)) redirect('/portefeuille');
  return appartenance;
}
