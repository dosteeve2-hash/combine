import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { organisationDe, sessionActuelle } from '@/lib/session';
import { peutGerer } from '@/lib/portefeuille';
import { fichierCsv } from '@/lib/csv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ligne {
  nom: string;
  pays: string;
  ville: string | null;
  secteur: string;
  stade: string;
  statut: string;
  cree_le: string;
  decide_le: string | null;
  equipe_taille: number | null;
  formalise: boolean;
  ca_mensuel_fcfa: string | null;
  clients_actifs: number | null;
  besoin_fcfa: string | null;
  score: number | null;
  moyenne: string | null;
  evaluateurs: number;
  code_public: string | null;
}

const COLONNES: [string, (l: Ligne) => unknown][] = [
  ['Entreprise', (l) => l.nom],
  ['Pays', (l) => l.pays],
  ['Ville', (l) => l.ville],
  ['Secteur', (l) => l.secteur],
  ['Stade', (l) => l.stade],
  ['Statut candidature', (l) => l.statut],
  ['Candidature déposée le', (l) => l.cree_le?.slice(0, 10)],
  ['Décision le', (l) => l.decide_le?.slice(0, 10)],
  ['Taille équipe', (l) => l.equipe_taille],
  ['Formalisée', (l) => (l.formalise ? 'oui' : 'non')],
  ['CA mensuel (FCFA)', (l) => l.ca_mensuel_fcfa],
  ['Clients actifs', (l) => l.clients_actifs],
  ['Montant recherché (FCFA)', (l) => l.besoin_fcfa],
  ['Score de préparation', (l) => l.score],
  ['Note moyenne du comité', (l) => l.moyenne],
  ['Nombre d’évaluateurs', (l) => l.evaluateurs],
  ['Dossier public', (l) => (l.code_public ? `/dossier/${l.code_public}` : '')],
];

export async function GET(_requete: Request, contexte: { params: Promise<{ id: string }> }) {
  const { id } = await contexte.params;

  const session = await sessionActuelle();
  if (!session?.user) {
    return NextResponse.json({ erreur: 'Connexion requise.' }, { status: 401 });
  }

  const appartenance = await organisationDe(session.user.id);
  if (!appartenance) {
    return NextResponse.json({ erreur: 'Aucune structure rattachée.' }, { status: 403 });
  }

  // Un investisseur n'a accès qu'au portefeuille : l'export contient les dossiers en
  // cours d'instruction, que l'interface lui promet justement de ne pas lui montrer.
  if (!peutGerer(appartenance.role)) {
    return NextResponse.json(
      { erreur: 'Votre accès à cette structure est en lecture seule.' },
      { status: 403 },
    );
  }

  // L'export est une fonctionnalité payante : la limite est vérifiée côté serveur.
  if (!appartenance.plan.exportBailleur) {
    return NextResponse.json(
      {
        erreur: `L’export bailleur est inclus à partir du plan Programme. Votre plan actuel est « ${appartenance.plan.nom} ».`,
        plan: appartenance.plan.code,
      },
      { status: 402 },
    );
  }

  const appels = (await sql`
    select id, titre from appel
     where id = ${id} and organisation_id = ${appartenance.organisation.id}
  `) as { id: string; titre: string }[];
  if (!appels[0]) {
    return NextResponse.json({ erreur: 'Appel introuvable.' }, { status: 404 });
  }

  const lignes = (await sql`
    select d.nom, d.pays, d.ville, d.secteur, d.stade, c.statut,
           c.cree_le::text, c.decide_le::text, d.equipe_taille, d.formalise,
           d.ca_mensuel_fcfa::text, d.clients_actifs, d.besoin_fcfa::text, d.code_public,
           (select score from publication where dossier_id = d.id order by version desc limit 1) as score,
           (select round(avg((coalesce(equipe,0)+coalesce(probleme,0)+coalesce(traction,0)
                             +coalesce(modele,0)+coalesce(impact,0))/5.0), 2)::text
              from evaluation where candidature_id = c.id) as moyenne,
           (select count(*)::int from evaluation where candidature_id = c.id) as evaluateurs
      from candidature c
      join dossier d on d.id = c.dossier_id
     where c.appel_id = ${id}
     order by c.cree_le asc
  `) as Ligne[];

  const csv = fichierCsv(
    COLONNES.map(([titre]) => titre),
    lignes.map((l) => COLONNES.map(([, lire]) => lire(l))),
  );

  const nomFichier = `combine-${appels[0].titre.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${
    new Date().toISOString().slice(0, 10)
  }.csv`;

  // BOM UTF-8 : sans lui, Excel en français casse les accents.
  return new NextResponse(`﻿${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nomFichier}"`,
      'Cache-Control': 'no-store',
    },
  });
}
