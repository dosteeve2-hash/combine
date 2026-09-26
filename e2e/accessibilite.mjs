/**
 * Audit d'accessibilité — WCAG 2.1 niveau AA (CLAUDE.md, règles #2 et #4).
 *
 * Fait ce qu'un lecteur d'écran ferait : ouvre chaque page, authentifiée ou non,
 * et passe axe-core dessus. Une violation est un défaut, pas un avertissement.
 *
 *   npm run build && npm start &
 *   node --env-file=.env.local e2e/accessibilite.mjs
 *
 * Le script sème la cohorte de démonstration : les pages vides ne prouvent rien,
 * un tableau sans en-têtes ne se voit que lorsqu'il a des lignes.
 */
import { chromium } from 'playwright';
import pg from 'pg';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { exigerCibleLocale } from '../scripts/exiger-cible-locale.mjs';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
exigerCibleLocale(process.env.DATABASE_URL, 'DATABASE_URL');
exigerCibleLocale(BASE, 'BASE_URL');
// Le conteneur de développement fournit Chromium à un chemin fixe ; sur un
// runner de CI, c'est Playwright qui l'a installé et qui sait où il est.
// Forcer le chemin du conteneur ferait échouer la CI sans rapport avec le code.
const CHROME = existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
  ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
  : undefined;
const MDP_DEMO = process.env.COMBINE_DEMO_PASSWORD;
if (!MDP_DEMO || MDP_DEMO.length < 16) {
  console.error('COMBINE_DEMO_PASSWORD doit contenir au moins 16 caractères dans .env.local.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const navigateur = await chromium.launch({
  headless: true,
  ...(CHROME ? { executablePath: CHROME } : {}),
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const violations = [];
let pagesAuditees = 0;

async function connecter(email) {
  const ctx = await navigateur.newContext({
    viewport: { width: 1280, height: 900 },
    locale: 'fr-FR',
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/connexion`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="motDePasse"]', MDP_DEMO);
  await Promise.all([
    page.waitForURL('**/tableau-de-bord', { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  return { ctx, page };
}

/** WCAG parle de l'état stable d'une page, pas d'une image arrêtée au milieu
 *  d'un fondu. Mesurer pendant l'animation d'entrée donne la couleur du texte
 *  mélangée au fond — c'est ce qui a fait tomber la CI à 4,45 : 1 sur un runner
 *  plus lent, alors que la valeur au repos est à 5,40. On attend donc que toutes
 *  les animations soient terminées. `reducedMotion` les réduit déjà à 0,01 ms
 *  via `@media (prefers-reduced-motion: reduce)` ; ceci couvre le reste. */
async function animationsTerminees(page) {
  await page.evaluate(async () => {
    const encours = document.getAnimations().map((a) => a.finished.catch(() => {}));
    await Promise.all(encours);
    // Deux trames : le style calculé n'est à jour qu'après le prochain rendu.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

/** Un seul passage d'axe sur une page déjà ouverte, dans une largeur donnée. */
async function auditer(page, chemin, largeur) {
  await page.setViewportSize({ width: largeur, height: largeur < 500 ? 812 : 900 });
  await page.goto(`${BASE}${chemin}`, { waitUntil: 'domcontentloaded' });
  await animationsTerminees(page);
  await page.addScriptTag({ content: AXE });

  const resultat = await page.evaluate(async () =>
    // Les règles AA, plus les bonnes pratiques qui touchent vraiment un lecteur
    // d'écran (régions, ordre des titres) — pas le catalogue entier d'axe.
    window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    }),
  );

  pagesAuditees++;
  const etiquette = `${chemin} @${largeur}px`;
  if (resultat.violations.length === 0) {
    console.log(`  ✓ ${etiquette}`);
    return;
  }
  for (const v of resultat.violations) {
    console.log(`  ✗ ${etiquette} — [${v.impact}] ${v.id} : ${v.help} (${v.nodes.length})`);
    violations.push({
      chemin,
      largeur,
      id: v.id,
      impact: v.impact,
      help: v.help,
      exemples: v.nodes.slice(0, 3).map((n) => {
        const m = n.any?.[0]?.data;
        const mesure = m?.contrastRatio ? ` [${m.contrastRatio}:1 ${m.fgColor} sur ${m.bgColor}]` : '';
        return `${n.target.join(' ')}${mesure} :: ${n.html.slice(0, 140)}`;
      }),
    });
  }
}

/** Le débordement horizontal ne remonte pas dans axe, et c'est pourtant
 *  ce qui rend une page inutilisable sur un Android à 60 000 FCFA (filtre 3). */
async function verifierDebordement(page, chemin) {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${BASE}${chemin}`, { waitUntil: 'domcontentloaded' });
  await animationsTerminees(page);
  const trop = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (trop > 0) {
    console.log(`  ✗ ${chemin} @375px — débordement horizontal de ${trop}px`);
    violations.push({ chemin, largeur: 375, id: 'debordement-horizontal', impact: 'serious', help: `la page déborde de ${trop}px`, exemples: [] });
  } else {
    console.log(`  ✓ ${chemin} @375px — pas de débordement`);
  }
}

try {
  await client.connect();

  const publiques = ['/', '/tarifs', '/cadre-legal', '/connexion', '/inscription'];

  console.log('\nPages publiques');
  {
    const ctx = await navigateur.newContext({ locale: 'fr-FR', reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    for (const chemin of publiques) {
      await auditer(page, chemin, 1280);
      await auditer(page, chemin, 375);
    }
    const { rows } = await client.query("select code_public from dossier where publie = true order by cree_le limit 1");
    if (rows[0]) await auditer(page, `/dossier/${rows[0].code_public}`, 1280);
    else console.log('  · aucun dossier publié en base — /dossier/<code> non audité');
    await ctx.close();
  }

  console.log('\nEspace porteur (aminata@demo.combine.africa)');
  {
    const { ctx, page } = await connecter(`aminata@demo.combine.africa`);
    for (const chemin of ['/tableau-de-bord', '/tableau-de-bord/dossier', '/tableau-de-bord/passerelle']) {
      await auditer(page, chemin, 1280);
    }
    await ctx.close();
  }

  console.log('\nEspace investisseur (investisseur@demo.combine.africa)');
  {
    const { ctx, page } = await connecter(`investisseur@demo.combine.africa`);
    await auditer(page, '/flux', 1280);
    await auditer(page, '/flux', 375);
    await ctx.close();
  }

  /* Une seule session « structure » pour les deux blocs qui suivent.
   *
   * Le script se connectait une cinquième fois ici, et `next start` tombait sur
   * le limiteur de débit de Better Auth — actif en production, et plus strict
   * sur `/sign-in/email` que sur le reste : la connexion n'aboutissait jamais et
   * l'audit mourait sur un `waitForURL: Timeout 30000ms exceeded`.
   *
   * Réouvrir une session qu'on détient déjà n'apportait rien. On garde le même
   * contexte : un aller-retour d'authentification de moins, et le limiteur —
   * qui fait exactement son travail — n'est plus provoqué par nos propres tests. */
  {
    const { ctx, page } = await connecter(`fabrique@demo.combine.africa`);

    console.log('\nEspace structure (fabrique@demo.combine.africa)');
    const { rows } = await client.query('select id from appel order by cree_le limit 1');
    const chemins = ['/programme', '/portefeuille', '/tableau-de-bord'];
    if (rows[0]) chemins.push(`/programme/appel/${rows[0].id}`);
    for (const chemin of chemins) await auditer(page, chemin, 1280);

    console.log('\nDébordement horizontal à 375px (filtre 3 : un Android d’entrée de gamme)');
    for (const chemin of ['/', '/tarifs', '/programme', '/portefeuille', '/tableau-de-bord']) {
      await verifierDebordement(page, chemin);
    }

    await ctx.close();
  }
} finally {
  await navigateur.close();
  await client.end().catch(() => {});
}

console.log(`\n${pagesAuditees} passages d'axe.`);
if (violations.length === 0) {
  console.log('Aucune violation WCAG 2.1 AA. ✅');
  process.exit(0);
}

console.log(`\n${violations.length} violation(s) :\n`);
for (const v of violations) {
  console.log(`[${v.impact}] ${v.id} — ${v.chemin} @${v.largeur}px`);
  console.log(`   ${v.help}`);
  for (const e of v.exemples) console.log(`   · ${e}`);
}
process.exit(1);
