/**
 * Parcours utilisateur complet — Règle #1.
 *
 * Ne teste pas des fonctions : teste ce qu'un vrai utilisateur fait, dans un vrai
 * navigateur, contre une vraie base. Chaque étape échoue bruyamment.
 *
 *   node --env-file=.env.local e2e/parcours.mjs
 */
import { chromium } from 'playwright';
import pg from 'pg';
import { existsSync } from 'node:fs';
import { exigerCibleLocale } from '../scripts/exiger-cible-locale.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
exigerCibleLocale(process.env.DATABASE_URL, 'DATABASE_URL');
exigerCibleLocale(BASE, 'BASE_URL');
// Le conteneur de développement fournit Chromium à un chemin fixe ; sur un
// runner de CI, c'est Playwright qui l'a installé et qui sait où il est.
// Forcer le chemin du conteneur ferait échouer la CI sans rapport avec le code.
const CHROME = existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
  ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  : undefined;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

let reussis = 0;
const echecs = [];
const erreursConsole = [];

function verifier(nom, condition, detail = '') {
  if (condition) {
    reussis++;
    console.log(`  ✓ ${nom}`);
  } else {
    echecs.push(`${nom}${detail ? ` — ${detail}` : ''}`);
    console.log(`  ✗ ${nom}${detail ? ` — ${detail}` : ''}`);
  }
}


/** Le texte visible de la page. `locator.innerText()` attend l'actionnabilité de
 *  l'élément, ce qui n'a pas de sens sur <body> et peut bloquer : on lit le DOM. */
const texteDe = (page) => page.evaluate(() => document.body.innerText);

function titre(t) {
  console.log(`\n${t}`);
}

let porteur = null;
let incub = null;

const suffixe = Date.now().toString(36);
const PORTEUR = { nom: 'Aminata Ouedraogo', email: `porteur-${suffixe}@combine.test`, mdp: 'motdepasse123' };
const INCUB = { nom: 'Directeur Fabrique', email: `incub-${suffixe}@combine.test`, mdp: 'motdepasse123' };
const INVESTISSEUR = {
  nom: 'Investisseur Test',
  email: `investisseur-${suffixe}@combine.test`,
  mdp: 'motdepasse123',
};
const FINANCEUR = { nom: 'Bailleur Test', email: `financeur-${suffixe}@combine.test`, mdp: 'motdepasse123' };

const navigateur = await chromium.launch({
  headless: true,
  ...(CHROME ? { executablePath: CHROME } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function nouveauContexte() {
  const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: 'fr-FR' });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') erreursConsole.push(`${page.url()} :: ${m.text()}`);
  });
  page.on('response', (r) => {
    if (r.status() === 404 && new URL(r.url()).origin === BASE) {
      erreursConsole.push(`404 :: ${r.url()}`);
    }
  });
  return { ctx, page };
}

async function inscrire(page, u) {
  // En mode développement, Next peut avoir livré le HTML avant les bundles React.
  // Attendre la fin des requêtes initiales évite de cliquer avant l’hydratation.
  await page.goto(`${BASE}/inscription`, { waitUntil: 'networkidle' });
  await page.fill('input[name="nom"]', u.nom);
  await page.fill('input[name="email"]', u.email);
  await page.fill('input[name="motDePasse"]', u.mdp);

  // On capture la réponse d'inscription : si elle échoue, un timeout d'URL ne dirait
  // pas pourquoi, et un test dont l'échec est illisible ne sert à rien.
  const reponse = page
    .waitForResponse((r) => r.url().includes('/api/auth/sign-up/email'), { timeout: 30000 })
    .catch(() => null);
  await page.click('button[type="submit"]');
  const r = await reponse;
  const corps = r ? await r.json().catch(() => null) : null;

  if (r && !r.ok()) {
    throw new Error(`inscription de ${u.email} refusée : HTTP ${r.status()}`);
  }

  try {
    await page.waitForURL('**/tableau-de-bord', { timeout: 30000 });
  } catch {
    const alerte = await page
      .locator('[role="alert"]')
      .innerText()
      .catch(() => '(aucun message)');
    const etat = await page.evaluate(() => ({
      chemin: location.pathname,
      confirmations: [...document.querySelectorAll('[role="status"]')].map((element) => element.textContent),
      boutonDesactive: document.querySelector('button[type="submit"]')?.hasAttribute('disabled') ?? false,
    }));
    const erreur = corps?.error;
    throw new Error(
      `inscription de ${u.email} sans redirection — HTTP ${r?.status() ?? 'aucune réponse'}, ` +
        `erreur ${typeof erreur?.code === 'string' ? erreur.code : 'inconnue'}, ` +
        `message : ${alerte}, état : ${JSON.stringify(etat)}`,
    );
  }
}

async function reconnecter(page, u) {
  await page.locator('button[aria-label="Se déconnecter"]').click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
  await page.goto(`${BASE}/connexion`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', u.email);
  await page.fill('input[name="motDePasse"]', u.mdp);
  await Promise.all([
    page.waitForURL('**/tableau-de-bord', { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
}

try {
  await client.connect();

  // Un parcours qui compte des lignes doit partir d'une base vide, sinon il mesure
  // les restes du run précédent au lieu de ce qu'il vient de faire.
  await client.query(`truncate table
    valorisation, participation, invitation, evaluation, candidature, appel,
    import_passerelle, jeton_passerelle, interet, publication, dossier,
    membre, organisation, session, account, verification, "user"
    restart identity cascade`);
  console.log('Base remise à zéro.');

  // ------------------------------------------------------------------ accueil
  titre('1. La page d’accueil');
  {
    const { page } = await nouveauContexte();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    verifier('titre de l’onglet', (await page.title()).includes('COMBINE'));
    verifier('la phrase de vente est en haut', (await page.locator('h1').first().innerText()).toLowerCase().includes('capital'));
    verifier('les trois portes sont présentes', (await page.locator('article').count()) >= 3);
    verifier('lien vers les tarifs', await page.locator('a[href="/tarifs"]').first().isVisible());
    await page.close();
  }

  // -------------------------------------------------------------- inscription
  titre('2. Inscription d’un porteur de projet');
  porteur = await nouveauContexte();
  {
    await inscrire(porteur.page, PORTEUR);
    verifier('redirigé vers le tableau de bord', porteur.page.url().endsWith('/tableau-de-bord'));
    const texte = await texteDe(porteur.page);
    verifier('le prénom apparaît', texte.includes('Aminata'));
    verifier('aucun dossier au départ', texte.includes('Aucun dossier'));
    const { rows } = await client.query('select count(*)::int n from dossier where user_id = (select id from "user" where email=$1)', [PORTEUR.email]);
    verifier('registre vide en base (pas de données fictives semées)', rows[0].n === 0, `trouvé ${rows[0].n}`);
  }

  // ------------------------------------------------------------------ dossier
  titre('3. Monter le dossier, et voir le score monter');
  {
    const p = porteur.page;
    await p.goto(`${BASE}/tableau-de-bord/dossier`, { waitUntil: 'domcontentloaded' });

    // La barre collante en bas du formulaire affiche « N / 100 » : c'est la source la plus stable.
    const scoreDe = async () => {
      const t = await p.locator('text=/[0-9]+ \/ 100/').last().innerText();
      return Number(t.match(/([0-9]+)\s*\/\s*100/)[1]);
    };

    await p.fill('input[name="nom"]', 'Ferme avicole Tanguy');
    const scoreDebut = await scoreDe();
    verifier('score faible au départ', scoreDebut > 0 && scoreDebut < 30, `score=${scoreDebut}`);

    await p.selectOption('select[name="secteur"]', 'Agriculture');
    await p.selectOption('select[name="pays"]', 'Burkina Faso');
    await p.fill('input[name="ville"]', 'Bobo-Dioulasso');
    await p.fill('input[name="annee_creation"]', '2024');
    await p.check('input[name="stade"][value="premiers_clients"]');
    await p.fill('textarea[name="resume"]', 'Nous livrons 4000 oeufs par semaine aux boulangeries de Bobo, a prix stable toute l annee.');
    await p.fill('textarea[name="probleme"]', 'Les boulangeries de Bobo subissent des ruptures et des prix qui doublent en saison seche, ce qui casse leur production et leur fait perdre des clients.');
    await p.fill('textarea[name="solution"]', 'Un elevage de 1200 pondeuses avec un contrat de livraison hebdomadaire a prix fixe sur douze mois, et une tournee matinale.');
    await p.fill('textarea[name="clients"]', 'Le gerant d une boulangerie de quartier employant cinq a quinze personnes.');
    await p.fill('input[name="ca_mensuel_fcfa"]', '450000');
    await p.fill('input[name="clients_actifs"]', '12');
    await p.fill('textarea[name="croissance_commentaire"]', 'Trois clients en janvier, douze en aout. Le chiffre d affaires a double apres la deuxieme couveuse.');
    await p.fill('input[name="equipe_taille"]', '4');
    await p.fill('textarea[name="equipe_description"]', 'Aminata dirige l exploitation depuis 2024, Issa gere la logistique, deux employes sur site a plein temps.');
    await p.fill('textarea[name="modele"]', 'Vente au contrat, avec une marge de 18 pour cent sur chaque plateau livre.');
    await p.fill('textarea[name="concurrence"]', 'Les grossistes du marche central, qui ne garantissent ni le prix ni la regularite.');
    await p.fill('input[name="besoin_fcfa"]', '5000000');
    await p.selectOption('select[name="contrepartie"]', 'equity');
    await p.fill('textarea[name="usage_des_fonds"]', 'Trois millions pour la troisieme couveuse, un million de provende, un million de tresorerie.');

    const scoreFin = await scoreDe();
    verifier('le score monte au remplissage', scoreFin > scoreDebut, `${scoreDebut} -> ${scoreFin}`);
    verifier('score publiable atteint', scoreFin >= 60, `score=${scoreFin}`);

    await p.click('button:has-text("Enregistrer")');
    await p.waitForTimeout(3000);
    const { rows } = await client.query('select id, nom, publie from dossier where user_id=(select id from "user" where email=$1)', [PORTEUR.email]);
    verifier('dossier créé en base', rows.length === 1 && rows[0].nom === 'Ferme avicole Tanguy');
    verifier('pas encore publié', rows.length === 1 && rows[0].publie === false);
  }

  // --------------------------------------------------------------- publication
  titre('4. Publier — et vérifier que l’historique s’ajoute');
  let codePublic = null;
let codeInvitation = null;
  {
    const p = porteur.page;
    await p.goto(`${BASE}/tableau-de-bord/dossier`, { waitUntil: 'domcontentloaded' });
    const boutonPublier = p.locator('button:has-text("Publier")').first();
    verifier('le bouton publier est présent une fois le dossier enregistré', await boutonPublier.count() > 0);
    await boutonPublier.click();
    await p.waitForTimeout(3000);

    const { rows } = await client.query(
      'select d.code_public, (select count(*)::int from publication where dossier_id=d.id) as n from dossier d where d.user_id=(select id from "user" where email=$1)',
      [PORTEUR.email],
    );
    codePublic = rows[0]?.code_public;
    verifier('publication n° 1 enregistrée', rows[0]?.n === 1, `n=${rows[0]?.n}`);
    verifier('code public attribué', Boolean(codePublic), String(codePublic));

    // Republier doit ajouter, pas écraser.
    await p.goto(`${BASE}/tableau-de-bord/dossier`, { waitUntil: 'domcontentloaded' });
    await p.fill('input[name="clients_actifs"]', '18');
    await p.click('button:has-text("Enregistrer")');
    await p.waitForTimeout(2500);
    await p.locator('button:has-text("Publier")').first().click();
    await p.waitForTimeout(3000);
    const apres = await client.query(
      'select version, score from publication where dossier_id=(select id from dossier where code_public=$1) order by version',
      [codePublic],
    );
    verifier('la republication ajoute une ligne', apres.rows.length === 2, `${apres.rows.length} publication(s)`);
    verifier('la publication n° 1 existe toujours', apres.rows[0]?.version === 1);
  }

  // ------------------------------------------------------- page publique + fuite
  titre('5. La page publique, vue par un inconnu');
  {
    const { ctx, page } = await nouveauContexte(); // contexte neuf = non connecté
    const r = await page.goto(`${BASE}/dossier/${codePublic}`, { waitUntil: 'domcontentloaded' });
    verifier('la page publique répond 200', r.status() === 200, `statut ${r.status()}`);
    const texte = await texteDe(page);
    verifier('le nom du projet est visible', texte.includes('Ferme avicole Tanguy'));
    verifier('l’historique de publication est affiché', texte.includes('Publication n° 2') || texte.includes('Publication n° 1'));
    verifier('la mention déclarative est présente', texte.toLowerCase().includes('déclaré par le porteur'));
    verifier('⚠ l’e-mail du porteur N’EST PAS exposé', !texte.includes(PORTEUR.email), 'fuite de données personnelles');
    verifier('le montant recherché reste privé', !texte.includes('Montant recherché'));
    verifier('aucun appel au financement sur la page publique', !texte.includes('Marquer mon intérêt'));
    const html = await page.content();
    verifier('⚠ l’e-mail n’est pas non plus dans le HTML', !html.includes(PORTEUR.email), 'fuite dans le source');
    await ctx.close();
  }

  // ------------------------------------------------------------------- le flux
  titre('6. Le flux');
  {
    const { ctx, page } = await nouveauContexte();
    await page.goto(`${BASE}/flux`, { waitUntil: 'domcontentloaded' });
    verifier('un visiteur anonyme ne voit pas le flux privé', page.url().includes('/connexion'));
    await ctx.close();
  }

  // -------------------------------------------------------- structure + limites
  titre('7. Côté incubateur : structure, appel, et la limite du plan');
  incub = await nouveauContexte();
  {
    const p = incub.page;
    await inscrire(p, INCUB);
    await p.goto(`${BASE}/programme/creer`, { waitUntil: 'domcontentloaded' });
    await p.fill('input[name="nom"]', 'La Fabrique Test');
    await p.click('button:has-text("Créer ma structure")');
    await p.waitForTimeout(2500);

    await p.goto(`${BASE}/programme`, { waitUntil: 'domcontentloaded' });
    verifier('la structure existe', (await texteDe(p)).includes('La Fabrique Test'));

    await p.click('button:has-text("Nouvel appel")');
    await p.fill('input[name="titre"]', 'Cohorte agro 2027');
    await p.fill('textarea[name="description"]', 'Douze entreprises de transformation accompagnees six mois.');
    await p.click('button:has-text("Ouvrir l")');
    await p.waitForTimeout(2500);
    const un = await client.query("select count(*)::int n from appel where statut='ouvert'");
    verifier('appel ouvert', un.rows[0].n >= 1);

    // Plan Essai = 1 appel ouvert. Le second doit être refusé côté serveur.
    await p.goto(`${BASE}/programme`, { waitUntil: 'domcontentloaded' });
    const texte = await texteDe(p);
    verifier('la limite du plan est signalée dans l’interface', texte.includes('plan supérieur') || texte.includes('Passer au plan'));
  }

  // ------------------------------------------------------- export bailleur 402
  titre('8. L’export bailleur est bien payant');
  {
    const { rows } = await client.query("select id from appel order by cree_le desc limit 1");
    const reponse = await incub.page.request.get(`${BASE}/api/appel/${rows[0].id}/export`);
    verifier('export refusé en 402 sur le plan Essai', reponse.status() === 402, `statut ${reponse.status()}`);
    const corps = await reponse.json();
    verifier('le message cite le plan requis', String(corps.erreur).includes('Programme'));
  }

  // ------------------------------------------------------------- candidature
  titre('9. Candidater, évaluer, décider');
  {
    await porteur.page.goto(`${BASE}/tableau-de-bord`, { waitUntil: 'domcontentloaded' });
    const bouton = porteur.page.locator('button:has-text("Candidater")').first();
    verifier('le bouton candidater apparaît pour un dossier publié', await bouton.count() > 0);
    if (await bouton.count()) {
      await bouton.click();
      await porteur.page.waitForTimeout(2500);
    }
    const c = await client.query('select count(*)::int n from candidature');
    verifier('candidature enregistrée', c.rows[0].n === 1, `n=${c.rows[0].n}`);

    const appel = await client.query('select id from appel order by cree_le desc limit 1');
    await incub.page.goto(`${BASE}/programme/appel/${appel.rows[0].id}`, { waitUntil: 'domcontentloaded' });
    verifier('la candidature est visible côté incubateur', (await texteDe(incub.page)).includes('Ferme avicole Tanguy'));

    for (const critere of ['equipe', 'probleme', 'traction', 'modele', 'impact']) {
      // Les radios de la grille sont `sr-only` (le label porte le visuel) : c'est le bon
      // motif accessible, mais il faut cocher l'input lui-même.
      await incub.page.locator(`input[name="${critere}"][value="4"]`).first().check({ force: true });
    }
    await incub.page.click('button:has-text("Enregistrer mon évaluation")');
    await incub.page.waitForTimeout(2500);
    const e = await client.query('select equipe, impact from evaluation');
    verifier('évaluation enregistrée', e.rows.length === 1 && e.rows[0].equipe === 4);

    await incub.page.goto(`${BASE}/programme/appel/${appel.rows[0].id}`, { waitUntil: 'domcontentloaded' });
    await incub.page.click('button:has-text("Retenir")');
    await incub.page.waitForTimeout(2500);
    const d = await client.query("select statut from candidature");
    verifier('candidature retenue', d.rows[0].statut === 'retenue', d.rows[0].statut);
  }


  // ------------------------------------------------------------------ intérêt
  titre('10. Un financeur marque son intérêt');
  {
    const { ctx, page } = await nouveauContexte();
    await inscrire(page, FINANCEUR);

    const financeur = await client.query('select id from "user" where email = $1', [FINANCEUR.email]);
    await client.query('update "user" set "emailVerified" = true where id = $1', [financeur.rows[0].id]);
    await client.query(
      `insert into organisation (id, nom, pays, type) values ('test_org_financeur','Investisseur Test','Burkina Faso','fonds')`,
    );
    await client.query(
      `insert into membre (id, organisation_id, user_id, role) values ('test_membre_financeur','test_org_financeur',$1,'investisseur')`,
      [financeur.rows[0].id],
    );
    await reconnecter(page, FINANCEUR);

    await page.goto(`${BASE}/flux`, { waitUntil: 'domcontentloaded' });
    verifier('le financeur vérifié accède au flux privé', (await texteDe(page)).includes('Ferme avicole Tanguy'));
    await page.goto(`${BASE}/flux?pays=Mali`, { waitUntil: 'domcontentloaded' });
    verifier('le filtre pays exclut bien', !(await texteDe(page)).includes('Ferme avicole Tanguy'));
    await page.goto(`${BASE}/dossier/${codePublic}`, { waitUntil: 'domcontentloaded' });

    const avant = await texteDe(page);
    verifier('le financeur connecté voit le formulaire d’intérêt', avant.includes('Marquer mon intérêt'));
    verifier('les détails de financement sont visibles après authentification', avant.includes('Montant recherché'));
    // La preuve que ce n'est pas une transaction n'est pas dans le texte, elle est
    // dans le formulaire : il ne contient aucun champ où saisir de l'argent.
    const champsArgent = await page.evaluate(() => {
      const form = [...document.querySelectorAll('form')].find((f) =>
        f.querySelector('textarea[name="message"]'),
      );
      if (!form) return -1;
      return [...form.querySelectorAll('input')].filter(
        (i) => i.type !== 'hidden' && /montant|somme|fcfa|valeur|ticket/i.test(i.name + i.placeholder),
      ).length;
    });
    verifier('⚠ le formulaire d’intérêt ne collecte aucun montant', champsArgent === 0, `${champsArgent} champ(s)`);

    await page.fill('textarea[name="message"]', 'Votre modèle de contrat annuel nous intéresse.');
    await page.click('button:has-text("Envoyer mon intérêt")');
    await page.waitForTimeout(2500);

    const i = await client.query('select message from interet');
    verifier('intérêt enregistré', i.rows.length === 1, `${i.rows.length} ligne(s)`);
    verifier('le message est conservé', String(i.rows[0]?.message).includes('contrat annuel'));

    await page.goto(`${BASE}/dossier/${codePublic}`, { waitUntil: 'domcontentloaded' });
    verifier('l’intérêt n’est pas redemandé une fois transmis', (await texteDe(page)).includes('Intérêt transmis'));
    await ctx.close();
  }

  // ------------------------------------------------------------- portefeuille
  titre('11. Portefeuille et invitations vérifiées');
  {
    const p = incub.page;
    await p.goto(`${BASE}/portefeuille`, { waitUntil: 'domcontentloaded' });
    verifier('le portefeuille est accessible', (await texteDe(p)).includes('Portefeuille'));
    verifier('portefeuille vide au départ', (await texteDe(p)).includes('Portefeuille vide'));

    await p.click('button:has-text("Nouvelle participation")');
    await p.selectOption('select[name="dossier_id"]', { index: 1 });
    await p.fill('input[name="montant_fcfa"]', '2000000');
    await p.fill('input[name="pourcentage"]', '12,5');
    await p.click('button:has-text("Enregistrer la participation")');
    await p.waitForTimeout(2500);
    const part = await client.query('select montant_fcfa::text, pourcentage::text from participation');
    verifier('participation enregistrée', part.rows.length === 1 && part.rows[0].montant_fcfa === '2000000');
    verifier('la virgule décimale est acceptée', part.rows[0]?.pourcentage === '12.50', part.rows[0]?.pourcentage);

    await p.goto(`${BASE}/portefeuille`, { waitUntil: 'domcontentloaded' });
    const t = await texteDe(p);
    verifier('sans valorisation, la ligne vaut son coût (pas de plus-value inventée)', t.includes('1.00×'), t.match(/[\d.]+×/)?.[0]);

    // L'invitation est nominative — et la page ne doit proposer aucun placement au public.
    await p.fill('input[name="email"]', INVESTISSEUR.email);
    await p.click('button:has-text("Inviter")');
    await p.waitForTimeout(2500);
    const inv = await client.query('select code, role from invitation');
    verifier('invitation créée', inv.rows.length === 1 && inv.rows[0].role === 'investisseur');

    const { ctx, page: anon } = await nouveauContexte();
    const rep = await anon.goto(`${BASE}/invitation/${inv.rows[0].code}`, { waitUntil: 'domcontentloaded' });
    verifier('la page d’invitation répond', rep.status() === 200);
    const meta = await anon.locator('meta[name="robots"]').getAttribute('content').catch(() => null);
    verifier('⚠ la page d’invitation est en noindex', String(meta).includes('noindex'), String(meta));
    await ctx.close();

    codeInvitation = inv.rows[0].code;
  }

  // ------------------------------------------------- cloisonnement investisseur
  titre('12. Un investisseur reste enfermé dans le portefeuille');
  {
    const { ctx, page } = await nouveauContexte();
    await inscrire(page, INVESTISSEUR);
    await page.goto(`${BASE}/invitation/${codeInvitation}`, { waitUntil: 'domcontentloaded' });
    verifier('une adresse non vérifiée ne peut pas accepter', (await texteDe(page)).includes('Confirmez d’abord'));
    verifier('le formulaire d’acceptation reste masqué', (await page.locator('button:has-text("Accepter")').count()) === 0);
    const avantVerification = await client.query(
      `select count(*)::int n from membre where user_id = (select id from "user" where email = $1)`,
      [INVESTISSEUR.email],
    );
    verifier('aucune appartenance n’est créée avant vérification', avantVerification.rows[0].n === 0);

    await client.query('update "user" set "emailVerified" = true where email = $1', [INVESTISSEUR.email]);
    await reconnecter(page, INVESTISSEUR);
    await page.goto(`${BASE}/invitation/${codeInvitation}`, { waitUntil: 'domcontentloaded' });
    await page.click('button:has-text("Accepter")');
    await page.waitForURL('**/portefeuille', { timeout: 20000 });

    const r = await client.query(
      `select role from membre where user_id = (select id from "user" where email = $1)`,
      [INVESTISSEUR.email],
    );
    verifier('le rôle posé est bien « investisseur »', r.rows[0]?.role === 'investisseur', r.rows[0]?.role);

    const vue = await texteDe(page);
    verifier('il voit le portefeuille', vue.includes('Portefeuille'));
    verifier('la lecture seule lui est annoncée', vue.includes('Lecture seule'));
    verifier('⚠ il ne voit pas le panneau « Qui a accès »', !vue.includes('Inviter quelqu'));

    // Le cœur du sujet : cacher un lien n'est pas un contrôle d'accès.
    await page.goto(`${BASE}/programme`, { waitUntil: 'domcontentloaded' });
    verifier('⚠ /programme le renvoie au portefeuille', page.url().endsWith('/portefeuille'), page.url());

    const appel = await client.query('select id from appel order by cree_le desc limit 1');
    await page.goto(`${BASE}/programme/appel/${appel.rows[0].id}`, { waitUntil: 'domcontentloaded' });
    verifier('⚠ le détail d’un appel lui est refusé', page.url().endsWith('/portefeuille'), page.url());

    const exp = await page.request.get(`${BASE}/api/appel/${appel.rows[0].id}/export`);
    verifier('⚠ l’export bailleur lui répond 403', exp.status() === 403, `statut ${exp.status()}`);

    // Et les actions, appelées sans passer par l'interface.
    const cand = await client.query('select id, statut from candidature limit 1');
    const avant = cand.rows[0]?.statut;
    await page.evaluate(async (id) => {
      await fetch('/programme', { method: 'POST', body: new URLSearchParams({ id, statut: 'ecartee' }) });
    }, cand.rows[0].id);
    await page.waitForTimeout(1500);
    const apres = await client.query('select statut from candidature where id = $1', [cand.rows[0].id]);
    verifier('⚠ il ne peut pas écarter une candidature', apres.rows[0].statut === avant,
      `${avant} -> ${apres.rows[0].statut}`);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/flux`, { waitUntil: 'domcontentloaded' });
    const debordementFlux = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    verifier('le flux financeur tient à 375 px', debordementFlux <= 1, `${debordementFlux}px de trop`);

    await ctx.close();
  }

  // ------------------------------------------------------------------ mobile
  titre('13. Mobile — 375 px');
  {
    const ctx = await navigateur.newContext({ viewport: { width: 375, height: 812 }, locale: 'fr-FR' });
    const page = await ctx.newPage();
    for (const chemin of ['/', '/flux', '/tarifs', `/dossier/${codePublic}`]) {
      await page.goto(`${BASE}${chemin}`, { waitUntil: 'domcontentloaded' });
      const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      verifier(`aucun débordement horizontal sur ${chemin}`, debord <= 1, `${debord}px de trop`);
    }
    await ctx.close();
  }

  // ------------------------------------------------------------------ console
  titre('14. Console et ressources');
  verifier('aucune erreur console ni 404', erreursConsole.length === 0, erreursConsole.slice(0, 5).join(' | '));
} catch (e) {
  echecs.push(`EXCEPTION : ${e.message.split('\n')[0]}`);
  console.error('\n⨯ exception :', e.message.split('\n')[0]);
  for (const [nom, page] of [['porteur', porteur?.page], ['incubateur', incub?.page]]) {
    if (!page || page.isClosed()) continue;
    try {
      await page.screenshot({ path: `e2e/echec-${nom}.png` });
      console.error(`  page ${nom} : ${page.url()} — capture e2e/echec-${nom}.png`);
    } catch {}
  }
} finally {
  await navigateur.close();
  await client.end();
}

console.log('\n' + '='.repeat(60));
console.log(`${reussis} vérifications réussies, ${echecs.length} échec(s)`);
if (echecs.length) {
  console.log('\nÉchecs :');
  echecs.forEach((e) => console.log(`  · ${e}`));
}
process.exit(echecs.length ? 1 : 0);

