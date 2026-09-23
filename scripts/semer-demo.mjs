/**
 * Peuple la base avec une cohorte de démonstration.
 *
 * À lancer **explicitement**, jamais au démarrage de l'application :
 *
 *   npm run demo:semer              # crée la démo
 *   npm run demo:semer -- --effacer # la retire, sans toucher aux vrais comptes
 *   npm run demo:semer -- --sql     # écrit le script SQL au lieu de l'exécuter,
 *                                   # pour une base qu'on ne peut atteindre que
 *                                   # par une console (Neon depuis un réseau
 *                                   # restreint)
 *
 * Toutes les lignes créées portent un identifiant préfixé `demo_` et les comptes
 * utilisent le domaine `@demo.combine.africa` : on peut donc les retirer sans risque
 * pour les données réelles. C'est la leçon de LivestockOS, où onze animaux fictifs
 * s'étaient retrouvés dans le registre de tous les vrais comptes.
 *
 * Les entreprises sont inventées mais plausibles : ce sont des filières réelles du
 * Burkina, avec des ordres de grandeur réalistes. Rien n'est repris d'une vraie société.
 */
import { createHash, randomBytes, scryptSync } from 'node:crypto';
import pg from 'pg';
import { exigerCibleLocale } from './exiger-cible-locale.mjs';

const EFFACER = process.argv.includes('--effacer');
const EN_SQL = process.argv.includes('--sql');
const DOMAINE = '@demo.combine.africa';
const MOT_DE_PASSE = process.env.COMBINE_DEMO_PASSWORD;

if (process.env.COMBINE_ALLOW_DEMO_SEED !== 'true') {
  console.error('Pour confirmer une base locale dédiée, définis COMBINE_ALLOW_DEMO_SEED=true.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  console.error('Le semeur de démonstration est désactivé avec NODE_ENV=production.');
  process.exit(1);
}

if (!EFFACER && (!MOT_DE_PASSE || MOT_DE_PASSE.length < 16)) {
  console.error('COMBINE_DEMO_PASSWORD doit contenir au moins 16 caractères.');
  process.exit(1);
}

if (!process.env.DATABASE_URL && !EN_SQL) {
  console.error('DATABASE_URL est absent.');
  process.exit(1);
}

if (!EN_SQL) exigerCibleLocale(process.env.DATABASE_URL, 'DATABASE_URL');

/** Hachage compatible Better Auth (scrypt, format `salt:clé`). */
function hacher(motDePasse) {
  const sel = randomBytes(16).toString('hex');
  const cle = scryptSync(motDePasse.normalize('NFKC'), sel, 64, { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 });
  return `${sel}:${cle.toString('hex')}`;
}

const empreinte = (o) => createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0, 32);
const jours = (n) => new Date(Date.now() + n * 86_400_000);
const dateIso = (n) => jours(n).toISOString().slice(0, 10);

const PORTEURS = [
  {
    id: 'demo_dos_avicole',
    compte: 'aminata',
    contact: 'Aminata Ouédraogo',
    nom: 'Ferme avicole Tanguy',
    secteur: 'Agriculture',
    ville: 'Bobo-Dioulasso',
    stade: 'premiers_clients',
    resume:
      'Nous livrons 4 000 œufs par semaine aux boulangeries de Bobo-Dioulasso, à un prix fixé pour douze mois.',
    probleme:
      'Les boulangeries de Bobo subissent des ruptures d’œufs et des prix qui doublent en saison sèche. Elles arrêtent des productions entières et perdent des clients réguliers, faute de pouvoir garantir leur carte.',
    solution:
      'Un élevage de 1 200 pondeuses adossé à un contrat de livraison hebdomadaire à prix fixe sur douze mois, avec une tournée matinale qui dépose directement en boutique.',
    clients:
      'Le gérant d’une boulangerie de quartier employant cinq à quinze personnes, qui produit tous les jours et ne peut pas se permettre une rupture.',
    modele: 'Vente au contrat, marge de 18 % sur chaque plateau livré, facturation mensuelle.',
    concurrence:
      'Les grossistes du marché central, qui ne garantissent ni le prix ni la régularité et livrent quand ils peuvent.',
    equipe_taille: 4,
    equipe_description:
      'Aminata dirige l’exploitation depuis 2024 après huit ans en coopérative avicole. Issa gère la logistique et les tournées. Deux employés à plein temps sur site.',
    annee_creation: 2024,
    formalise: true,
    ca: 450_000,
    clients_actifs: 12,
    croissance:
      'Trois clients en janvier, douze en août. Le chiffre d’affaires a doublé après l’achat de la deuxième couveuse en mai.',
    besoin: 5_000_000,
    usage:
      'Trois millions pour la troisième couveuse, un million de provende sur six mois, un million de trésorerie pour absorber les délais de paiement.',
    contrepartie: 'equity',
  },
  {
    id: 'demo_dos_karite',
    compte: 'fatoumata',
    contact: 'Fatoumata Sankara',
    nom: 'Beurre de karité Sissili',
    secteur: 'Transformation alimentaire',
    ville: 'Léo',
    stade: 'premiers_clients',
    resume:
      'Nous transformons le karité de 140 productrices en beurre alimentaire certifié, vendu à deux exportateurs.',
    probleme:
      'Les productrices de karité de la Sissili vendent leurs amandes brutes à des collecteurs qui fixent seuls le prix. La valeur de la transformation part ailleurs, et le revenu dépend d’une seule récolte par an.',
    solution:
      'Une unité de transformation collective qui achète les amandes à prix garanti, produit un beurre alimentaire aux normes export, et reverse une prime de fin de campagne aux productrices.',
    clients:
      'L’acheteur qualité d’un exportateur de beurre alimentaire, qui a besoin d’un volume régulier et d’une traçabilité pour ses propres clients européens.',
    modele: 'Achat des amandes à prix garanti, vente du beurre au conteneur, marge de 22 %.',
    concurrence:
      'Les collecteurs individuels, qui n’offrent aucune traçabilité et ne peuvent pas fournir un volume régulier.',
    equipe_taille: 9,
    equipe_description:
      'Fatoumata coordonne l’unité et la relation avec les 140 productrices. Un responsable qualité formé aux normes export, sept opératrices en saison.',
    annee_creation: 2023,
    formalise: true,
    ca: 1_850_000,
    clients_actifs: 2,
    croissance:
      'Un seul acheteur en 2024, deux depuis mars 2026. Le volume mensuel est passé de 1,2 à 3,4 tonnes.',
    besoin: 12_000_000,
    usage:
      'Huit millions pour une presse hydraulique, deux millions pour la certification, deux millions de fonds de roulement pour la campagne.',
    contrepartie: 'equity',
  },
  {
    id: 'demo_dos_froid',
    compte: 'issa',
    contact: 'Issa Zongo',
    nom: 'Froid Sahel',
    secteur: 'Logistique & transport',
    ville: 'Ouagadougou',
    stade: 'prototype',
    resume:
      'Nous louons de la chambre froide à la palette aux maraîchers de Ouaga, à la semaine, sans engagement.',
    probleme:
      'Un maraîcher qui récolte en pleine saison doit vendre en trois jours ou perdre sa production. Il brade. La chambre froide existe mais se loue au mois, à un tarif que seul un gros opérateur peut payer.',
    solution:
      'Une chambre froide découpée en emplacements à la palette, louée à la semaine, avec relevé de température consultable par le client.',
    clients:
      'Le maraîcher qui livre entre deux et dix tonnes par récolte et n’a aujourd’hui aucune alternative au bradage.',
    modele: 'Location à la palette et à la semaine, 6 500 FCFA la palette-semaine.',
    concurrence:
      'Les entrepôts frigorifiques existants, qui ne louent qu’au mois et qu’à des volumes industriels.',
    equipe_taille: 2,
    equipe_description:
      'Issa a été technicien frigoriste pendant onze ans. Un associé gère la relation commerciale avec les maraîchers.',
    annee_creation: 2026,
    formalise: false,
    ca: 0,
    clients_actifs: 0,
    croissance: '',
    besoin: 18_000_000,
    usage: '',
    contrepartie: 'pret',
  },
  {
    id: 'demo_dos_soumbala',
    compte: 'salimata',
    contact: 'Salimata Kaboré',
    nom: 'Soumbala Faso',
    secteur: 'Transformation alimentaire',
    ville: 'Koudougou',
    stade: 'croissance',
    resume:
      'Nous produisons du soumbala en cubes calibrés, conditionné et daté, vendu en grandes surfaces à Ouaga et Abidjan.',
    probleme:
      'Le soumbala se vend en boule, sans emballage ni date. Les enseignes modernes et la diaspora ne peuvent pas l’acheter : ni code-barres, ni durée de conservation, ni régularité de goût.',
    solution:
      'Une fermentation maîtrisée en atelier, un calibrage en cubes, un conditionnement daté avec code-barres — et le même goût d’un lot à l’autre.',
    clients:
      'L’acheteur d’une enseigne de grande distribution, qui référence un produit local seulement s’il est conforme et régulier.',
    modele: 'Vente en gros aux enseignes, marge de 31 %, paiement à 30 jours.',
    concurrence:
      'Le soumbala de marché, imbattable sur le prix mais impossible à référencer en grande surface.',
    equipe_taille: 14,
    equipe_description:
      'Salimata dirige l’atelier depuis 2022. Une responsable qualité, douze opératrices dont neuf issues du groupement de femmes d’origine.',
    annee_creation: 2022,
    formalise: true,
    ca: 3_200_000,
    clients_actifs: 6,
    croissance:
      'Deux enseignes en 2024, six en 2026 dont deux à Abidjan. Le chiffre d’affaires mensuel a été multiplié par quatre en deux ans.',
    besoin: 25_000_000,
    usage:
      'Quinze millions pour une seconde ligne de conditionnement, six millions pour le dépôt d’Abidjan, quatre millions de trésorerie.',
    contrepartie: 'equity',
  },
];

/** Rend une valeur JavaScript sous forme de littéral SQL. Sert uniquement au
 *  mode `--sql`, pour une base qu'on ne peut atteindre qu'en collant du texte
 *  (console Neon, connecteur MCP) — jamais pour construire une requête à partir
 *  d'une saisie utilisateur. */
function litteral(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error(`nombre non fini : ${v}`);
    return String(v);
  }
  if (v instanceof Date) return `'${v.toISOString()}'::timestamptz`;
  // Un tableau va dans une colonne `text[]`, pas dans du JSON : `pg` le traduit
  // en littéral de tableau Postgres, on fait pareil.
  if (Array.isArray(v)) return `array[${v.map(litteral).join(',')}]::text[]`;
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  if (typeof v !== 'string') throw new Error(`type non pris en charge : ${typeof v}`);
  return `'${v.replace(/'/g, "''")}'`;
}

/** Le même contrat que `pg.Client`, mais qui écrit au lieu d'exécuter. */
function redacteurSql() {
  const lignes = ['begin;'];
  return {
    connect: async () => {},
    end: async () => {
      lignes.push('commit;');
      process.stdout.write(lignes.join('\n') + '\n');
    },
    query: async (texte, valeurs = []) => {
      const sql = texte.replace(/\$(\d+)/g, (_, n) => litteral(valeurs[Number(n) - 1]));
      lignes.push(`${sql.trim().replace(/\s+/g, ' ')};`);
      return { rows: [] };
    },
  };
}

const client = EN_SQL ? redacteurSql() : new pg.Client({ connectionString: process.env.DATABASE_URL });

/** En mode `--sql`, la sortie standard porte le script : les commentaires vont
 *  sur l'erreur standard pour ne pas le corrompre. */
const dire = (...a) => (EN_SQL ? console.error(...a) : console.log(...a));

async function effacer() {
  await client.query(`delete from "user" where email like $1`, [`%${DOMAINE}`]);
  await client.query(`delete from organisation where id like 'demo_%'`);
  await client.query(`delete from dossier where id like 'demo_%'`);
  dire('Démonstration retirée. Les comptes réels n’ont pas été touchés.');
}

async function semer() {
  await effacer();

  const motDePasse = hacher(MOT_DE_PASSE);
  const comptes = [
    ...PORTEURS.map((p) => ({ id: `demo_u_${p.compte}`, nom: p.contact, email: `${p.compte}${DOMAINE}` })),
    { id: 'demo_u_fabrique', nom: 'Direction La Fabrique', email: `fabrique${DOMAINE}` },
    { id: 'demo_u_investisseur', nom: 'Investisseur associé', email: `investisseur${DOMAINE}` },
  ];

  for (const c of comptes) {
    await client.query(
      `insert into "user" (id, name, email, "emailVerified") values ($1,$2,$3,true)`,
      [c.id, c.nom, c.email],
    );
    await client.query(
      `insert into account (id, "accountId", "providerId", "userId", password)
       values ($1,$2,'credential',$2,$3)`,
      [`demo_acc_${c.id}`, c.id, motDePasse],
    );
  }

  // La structure, son appel ouvert, et ses membres.
  await client.query(
    `insert into organisation (id, nom, pays, type, plan, plan_expire_le)
     values ('demo_org_fabrique','La Fabrique','Burkina Faso','incubateur','programme',$1)`,
    [jours(300)],
  );
  await client.query(
    `insert into membre (id, organisation_id, user_id, role) values
      ('demo_mbr_1','demo_org_fabrique','demo_u_fabrique','proprietaire'),
      ('demo_mbr_2','demo_org_fabrique','demo_u_investisseur','investisseur')`,
  );
  await client.query(
    `insert into appel (id, organisation_id, titre, description, secteurs, pays, score_minimum, ferme_le, statut)
     values ('demo_apl_1','demo_org_fabrique','Cohorte agro-transformation 2027',
       'Douze entreprises de transformation agroalimentaire au Burkina, avec au moins un client payant, accompagnées six mois et financées entre 5 et 30 millions de FCFA.',
       $1, $2, 60, $3, 'ouvert')`,
    [['Agriculture', 'Transformation alimentaire', 'Logistique & transport'], ['Burkina Faso'], dateIso(45)],
  );

  for (const [i, p] of PORTEURS.entries()) {
    const code = `DEMO-${String(i + 1).padStart(4, '0')}`;
    const publiable = p.ca > 0;

    await client.query(
      `insert into dossier (id, user_id, nom, secteur, pays, ville, stade, resume, probleme, solution,
         clients, modele, concurrence, equipe_taille, equipe_description, annee_creation, formalise,
         ca_mensuel_fcfa, clients_actifs, croissance_commentaire, besoin_fcfa, usage_des_fonds,
         contrepartie, contact_nom, contact_email, contact_telephone, code_public, publie, cree_le)
       values ($1,$2,$3,$4,'Burkina Faso',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
               nullif($17,0),nullif($18,0),nullif($19,''),$20,nullif($21,''),$22,$23,$24,$25,$26,$27,$28)`,
      [
        p.id, `demo_u_${p.compte}`, p.nom, p.secteur, p.ville, p.stade, p.resume, p.probleme,
        p.solution, p.clients, p.modele, p.concurrence, p.equipe_taille, p.equipe_description,
        p.annee_creation, p.formalise, p.ca, p.clients_actifs, p.croissance, p.besoin, p.usage,
        p.contrepartie, p.contact, `${p.compte}${DOMAINE}`, '+226 70 00 00 0' + i,
        publiable ? code : null, publiable, jours(-120 + i * 10),
      ],
    );

    if (!publiable) continue;

    // Plusieurs publications espacées : c'est l'historique qui fait la preuve, pas le dernier chiffre.
    const versions = [
      { v: 1, score: 68, jour: -110 + i * 10 },
      { v: 2, score: 79, jour: -55 + i * 10 },
      { v: 3, score: 88, jour: -6 + i },
    ];
    for (const { v, score, jour } of versions) {
      const contenu = { nom: p.nom, version: v, ca_mensuel_fcfa: p.ca };
      await client.query(
        `insert into publication (id, dossier_id, version, score, empreinte, contenu, publie_le)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [`demo_pub_${p.compte}_${v}`, p.id, v, score, empreinte(contenu), JSON.stringify(contenu), jours(jour)],
      );
    }

    await client.query(
      `insert into candidature (id, appel_id, dossier_id, statut, decide_le, cree_le)
       values ($1,'demo_apl_1',$2,$3,$4,$5)`,
      [`demo_can_${p.compte}`, p.id, i < 2 ? 'retenue' : 'en_evaluation',
       i < 2 ? jours(-20) : null, jours(-40 + i * 5)],
    );

    await client.query(
      `insert into evaluation (id, candidature_id, user_id, equipe, probleme, traction, modele, impact, commentaire)
       values ($1,$2,'demo_u_fabrique',$3,$4,$5,$6,$7,$8)`,
      [`demo_eva_${p.compte}`, `demo_can_${p.compte}`,
       [4, 5, 3, 5][i], [5, 4, 5, 4][i], [3, 4, 2, 5][i], [4, 4, 3, 5][i], [4, 5, 4, 5][i],
       [
         'Traction réelle mais concentrée sur un seul canal de vente. À surveiller.',
         'La prime de fin de campagne aux productrices est un vrai différenciateur, pas un argument de façade.',
         'Le besoin est énorme et le fondateur connaît son métier, mais rien n’est encore vendu.',
         'Le dossier le plus avancé de la cohorte. La question est la vitesse, pas la viabilité.',
       ][i]],
    );
  }

  // Deux participations, dont une valorisée plusieurs fois.
  await client.query(
    `insert into participation (id, organisation_id, dossier_id, instrument, montant_fcfa,
       pourcentage, valorisation_entree_fcfa, date_entree, statut, notes)
     values
      ('demo_par_1','demo_org_fabrique','demo_dos_avicole','equity',2000000,12.50,16000000,$1,'active',
       'Pacte signé. Jalon 1 : troisième couveuse installée avant la fin du trimestre.'),
      ('demo_par_2','demo_org_fabrique','demo_dos_karite','convertible',6000000,null,null,$2,'active',
       'Obligation convertible au prochain tour, plafond de valorisation à 60 millions.')`,
    [dateIso(-190), dateIso(-95)],
  );
  await client.query(
    `insert into valorisation (id, participation_id, valeur_fcfa, ca_mensuel_fcfa, employes, commentaire, constatee_le)
     values
      ('demo_val_1','demo_par_1',2400000,600000,5,'Après l’installation de la troisième couveuse.',$1),
      ('demo_val_2','demo_par_1',3200000,850000,7,'Deux nouvelles boulangeries sous contrat annuel.',$2),
      ('demo_val_3','demo_par_2',7500000,1850000,9,'Second acheteur export signé, volume mensuel triplé.',$3)`,
    [dateIso(-84), dateIso(-7), dateIso(-12)],
  );

  await client.query(
    `insert into interet (id, dossier_id, user_id, message, cree_le)
     values ('demo_int_1','demo_dos_soumbala','demo_u_investisseur',
       'Votre régularité de goût d’un lot à l’autre nous intéresse. Pouvons-nous visiter l’atelier ?',$1)`,
    [jours(-9)],
  );

  dire('Cohorte de démonstration créée.\n');
  dire('  Structure   La Fabrique — plan Programme');
  dire('  Appel       Cohorte agro-transformation 2027 (ouvert)');
  dire(`  Dossiers    ${PORTEURS.length} porteurs, 3 publiés avec historique, 1 en construction`);
  dire('  Portefeuille 2 participations, 3 valorisations\n');
  dire('  Les identifiants restent dans la configuration locale et ne sont pas affichés.');
  dire('  Comptes :');
  for (const c of comptes) dire(`    · ${c.email.padEnd(38)} ${c.nom}`);
  dire('\n  Pour retirer : npm run demo:semer -- --effacer');
}

try {
  await client.connect();
  await (EFFACER ? effacer() : semer());
} catch (e) {
  console.error('Échec :', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
