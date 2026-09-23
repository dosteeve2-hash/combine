/**
 * Active un plan payant pour une structure, à la main.
 *
 * Tant que les clients se comptent sur les doigts d'une main, l'encaissement se fait
 * hors ligne (Orange Money, Moov Money, virement) et l'activation passe par ici.
 * C'est volontaire : un bouton « payer » automatisé coûte plus cher à construire
 * qu'il ne rapporte avant le dixième client.
 *
 *   npm run plan:activer -- "La Fabrique" programme 12 "OM-20260922-4471"
 *                            ^structure     ^plan     ^mois ^référence de paiement
 *
 * Plans : essai · programme · institution
 */
import pg from 'pg';

const [, , nomStructure, plan, moisBrut, reference] = process.argv;
const PLANS = ['essai', 'programme', 'institution'];

if (!nomStructure || !plan) {
  console.error(
    'Usage : npm run plan:activer -- "<nom de la structure>" <essai|programme|institution> [mois] ["référence"]',
  );
  process.exit(1);
}
if (!PLANS.includes(plan)) {
  console.error(`Plan inconnu : « ${plan} ». Attendu : ${PLANS.join(', ')}.`);
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL est absent.');
  process.exit(1);
}

const mois = Number(moisBrut ?? 1);
if (!Number.isFinite(mois) || mois < 1 || mois > 36) {
  console.error('Le nombre de mois doit être compris entre 1 et 36.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();

  const { rows: candidates } = await client.query(
    `select id, nom, pays, plan, plan_expire_le from organisation where nom ilike $1`,
    [nomStructure],
  );

  if (candidates.length === 0) {
    console.error(`Aucune structure nommée « ${nomStructure} ».`);
    const { rows: toutes } = await client.query(
      'select nom, pays from organisation order by cree_le desc limit 15',
    );
    if (toutes.length) {
      console.error('\nStructures existantes :');
      console.error(toutes.map((o) => `  · ${o.nom} (${o.pays})`).join('\n'));
    }
    process.exit(1);
  }
  if (candidates.length > 1) {
    console.error(`Plusieurs structures portent ce nom. Précisez : `);
    console.error(candidates.map((o) => `  · ${o.nom} — ${o.id}`).join('\n'));
    process.exit(1);
  }

  const org = candidates[0];

  // On prolonge à partir de la date de fin en cours si l'abonnement court encore,
  // sinon à partir d'aujourd'hui. Un client qui renouvelle en avance ne perd rien.
  const depart =
    org.plan_expire_le && new Date(org.plan_expire_le) > new Date()
      ? new Date(org.plan_expire_le)
      : new Date();
  const fin = new Date(depart);
  fin.setMonth(fin.getMonth() + mois);

  const { rows } = await client.query(
    `update organisation
        set plan = $1, plan_expire_le = $2, plan_reference = $3
      where id = $4
      returning nom, plan, plan_expire_le`,
    [plan, plan === 'essai' ? null : fin.toISOString(), reference ?? null, org.id],
  );

  const r = rows[0];
  console.log(`✓ ${r.nom}`);
  console.log(`  plan     : ${r.plan}`);
  console.log(
    `  échéance : ${r.plan_expire_le ? new Date(r.plan_expire_le).toLocaleDateString('fr-FR') : '—'}`,
  );
  if (reference) console.log(`  référence: ${reference}`);
} catch (e) {
  console.error('Échec :', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
