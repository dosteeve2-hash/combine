import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nouvelId, sql } from '@/lib/db';
import { empreinteJeton, passerelleDisponible, SOURCES } from '@/lib/passerelle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const TAILLE_MAX = 16 * 1024;
const REQUETES_MAX_PAR_MINUTE = 60;
const passerelleActive = passerelleDisponible(
  process.env.NODE_ENV === 'production',
  process.env.COMBINE_PASSERELLE_ACTIVE,
);

/**
 * Point d'entrée de la passerelle FORGE.
 *
 *   POST /api/passerelle
 *   Authorization: Bearer cmb_xxxxxxxx…
 *   Content-Type: application/json
 *
 *   { "source": "livestockos", "ca_mensuel_fcfa": 450000, "clients_actifs": 12,
 *     "employes": 4, "constate_le": "2026-09-22",
 *     "lien_verification": "https://livestock-os-ashy.vercel.app/verifier/K7M2-P9XQ" }
 *
 * L'import est enregistré mais **jamais appliqué automatiquement** : le porteur le voit
 * dans son espace et décide de le reprendre. Une application extérieure alimente son
 * dossier, elle ne le réécrit pas dans son dos.
 */

const positif = z
  .union([z.number(), z.string()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
  });

const schema = z.object({
  source: z.string().trim().min(1),
  constate_le: z.string().trim().max(10).optional(),
  ca_mensuel_fcfa: positif,
  clients_actifs: positif,
  employes: positif,
  commentaire: z.string().trim().max(2000).optional(),
  lien_verification: z.string().trim().url().max(500).optional(),
});

function refus(message: string, statut: number) {
  return NextResponse.json({ ok: false, erreur: message }, { status: statut });
}

async function lireCorpsLimite(requete: Request): Promise<string | null> {
  const tailleAnnoncee = Number(requete.headers.get('content-length'));
  if (Number.isFinite(tailleAnnoncee) && tailleAnnoncee > TAILLE_MAX) return null;

  const lecteur = requete.body?.getReader();
  if (!lecteur) return '';

  const morceaux: Uint8Array[] = [];
  let taille = 0;
  while (true) {
    const { done, value } = await lecteur.read();
    if (done) break;
    taille += value.byteLength;
    if (taille > TAILLE_MAX) {
      await lecteur.cancel();
      return null;
    }
    morceaux.push(value);
  }

  const corps = new Uint8Array(taille);
  let position = 0;
  for (const morceau of morceaux) {
    corps.set(morceau, position);
    position += morceau.byteLength;
  }
  return new TextDecoder().decode(corps);
}

export async function POST(requete: Request) {
  if (!passerelleActive) {
    return refus('La passerelle est désactivée en production tant que la protection contre les abus n’est pas configurée.', 503);
  }

  const entete = requete.headers.get('authorization') ?? '';
  const jeton = entete.startsWith('Bearer ') ? entete.slice(7).trim() : '';
  if (!jeton.startsWith('cmb_') || jeton.length > 512) {
    return refus('Jeton absent ou mal formé. Attendu : Authorization: Bearer cmb_…', 401);
  }

  const texte = await lireCorpsLimite(requete);
  if (texte === null) return refus('Le corps dépasse la limite de 16 Ko.', 413);
  if (!texte) return refus('Corps JSON illisible.', 400);

  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    return refus('Corps JSON illisible.', 400);
  }

  const analyse = schema.safeParse(brut);
  if (!analyse.success) {
    return refus(analyse.error.issues[0]?.message ?? 'Charge invalide.', 400);
  }
  const charge = analyse.data;

  if (!SOURCES.some((s) => s.valeur === charge.source)) {
    return refus(
      `Source inconnue. Valeurs acceptées : ${SOURCES.map((s) => s.valeur).join(', ')}.`,
      400,
    );
  }

  // On compare l'empreinte, jamais le jeton : la base ne contient rien de réutilisable.
  const jetons = (await sql`
    select id, dossier_id, source, revoque
      from jeton_passerelle where jeton_empreinte = ${await empreinteJeton(jeton)}
  `) as { id: string; dossier_id: string; source: string; revoque: boolean }[];
  const enregistre = jetons[0];

  if (!enregistre || enregistre.revoque) return refus('Jeton inconnu ou révoqué.', 401);
  if (enregistre.source !== charge.source) {
    return refus(
      `Ce jeton a été émis pour « ${enregistre.source} », pas pour « ${charge.source} ».`,
      403,
    );
  }

  const limites = (await sql`
    insert into limite_passerelle (dossier_id, source, fenetre, requetes)
    values (${enregistre.dossier_id}, ${enregistre.source}, date_trunc('minute', now()), 1)
    on conflict (dossier_id, source) do update set
      fenetre = case
        when limite_passerelle.fenetre < date_trunc('minute', now()) then date_trunc('minute', now())
        else limite_passerelle.fenetre
      end,
      requetes = case
        when limite_passerelle.fenetre < date_trunc('minute', now()) then 1
        else limite_passerelle.requetes + 1
      end
    returning requetes
  `) as { requetes: number }[];

  if ((limites[0]?.requetes ?? REQUETES_MAX_PAR_MINUTE + 1) > REQUETES_MAX_PAR_MINUTE) {
    return NextResponse.json(
      { ok: false, erreur: 'Trop de requêtes pour ce dossier et cette source. Réessayez dans une minute.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  await sql`update jeton_passerelle set dernier_usage_le = now() where id = ${enregistre.id}`;

  await sql`
    insert into import_passerelle (id, dossier_id, source, charge)
    values (${nouvelId('imp')}, ${enregistre.dossier_id}, ${charge.source}, ${JSON.stringify(charge)})
  `;
  return NextResponse.json(
    {
      ok: true,
      message:
        'Chiffres reçus. Ils attendent la validation du porteur avant d’entrer dans son dossier.',
    },
    { status: 202 },
  );
}

export async function GET() {
  if (!passerelleActive) {
    return NextResponse.json({
      service: 'Passerelle FORGE — COMBINE',
      statut: 'désactivée en Production',
      raison: 'Une limite IP de confiance doit être configurée avant ouverture.',
    });
  }

  return NextResponse.json({
    service: 'Passerelle FORGE — COMBINE',
    methode: 'POST',
    authentification: 'Authorization: Bearer <jeton émis par le porteur dans COMBINE>',
    sources: SOURCES.map((s) => s.valeur),
    champs: {
      source: 'obligatoire, une des sources ci-dessus',
      constate_le: 'AAAA-MM-JJ, facultatif',
      ca_mensuel_fcfa: 'entier, facultatif',
      clients_actifs: 'entier, facultatif',
      employes: 'entier, facultatif',
      commentaire: 'texte court, facultatif',
      lien_verification: 'URL publique vérifiable chez la source, facultatif',
    },
    reponse: '202 si accepté — l’import attend la validation du porteur',
    limites: {
      corps_max_octets: TAILLE_MAX,
      requetes_par_jeton_par_minute: REQUETES_MAX_PAR_MINUTE,
    },
  });
}
